"""
Django Admin Configuration for Blockchain Module

This module configures the Django admin interface for blockchain-related models.
"""

from decimal import Decimal

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from services.db_teocoin_service import DBTeoCoinService

from .models import (
    DBTeoCoinBalance,
    DBTeoCoinTransaction,
    TeoCoinWithdrawalRequest,
    UserWallet,
)

User = get_user_model()


@admin.register(UserWallet)
class UserWalletAdmin(admin.ModelAdmin):
    """
    Admin configuration for UserWallet model.

    Security Note: Private keys are masked in the admin interface
    to prevent accidental exposure.
    """

    list_display = ("user", "address", "masked_private_key_display", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email", "address")
    readonly_fields = ("created_at", "masked_private_key_display")

    fieldsets = (
        ("User Information", {"fields": ("user",)}),
        (
            "Wallet Details",
            {"fields": ("address", "private_key", "masked_private_key_display")},
        ),
        ("Timestamps", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    @admin.display(description="Private Key (Masked)")
    def masked_private_key_display(self, obj):
        """Display masked private key in admin interface."""
        return obj.get_masked_private_key()

    def has_delete_permission(self, request, obj=None):
        """
        Restrict wallet deletion to superusers only.
        This prevents accidental loss of wallet data.
        """
        return request.user.is_superuser


@admin.register(DBTeoCoinBalance)
class DBTeoCoinBalanceAdmin(admin.ModelAdmin):
    """
    Admin configuration for DBTeoCoinBalance model.
    Allows admins to view and manage user TeoCoin balances.
    """

    list_display = (
        "user_info",
        "available_balance",
        "staked_balance",
        "pending_withdrawal",
        "total_balance_display",
        "updated_at",
    )
    list_filter = ("updated_at", "user__role")
    search_fields = (
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
    )
    readonly_fields = ("total_balance_display", "updated_at", "created_at")

    fieldsets = (
        ("User Information", {"fields": ("user",)}),
        (
            "Balance Details",
            {
                "fields": (
                    "available_balance",
                    "staked_balance",
                    "pending_withdrawal",
                    "total_balance_display",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["add_balance_action", "subtract_balance_action", "reset_balance_action"]

    @admin.display(description="User")
    def user_info(self, obj):
        """Display user info with role badge."""
        role_colors = {"admin": "#dc3545", "teacher": "#198754", "student": "#0d6efd"}
        color = role_colors.get(obj.user.role, "#6c757d")
        return format_html(
            '<strong>{}</strong><br><small style="color: {};">● {}</small><br><small>{}</small>',
            obj.user.get_full_name() or obj.user.username,
            color,
            obj.user.role.title(),
            obj.user.email,
        )

    @admin.display(description="Total Balance")
    def total_balance_display(self, obj):
        """Display total balance with EUR equivalent."""
        total = obj.available_balance + obj.staked_balance + obj.pending_withdrawal
        return format_html(
            "<strong>{} TEO</strong><br><small>≈ {} EUR</small>",
            f"{total:.2f}",
            f"{total:.2f}",
        )

    @admin.action(description="Add 100 TEO to selected users")
    def add_balance_action(self, request, queryset):
        """Add balance to selected users."""
        service = DBTeoCoinService()
        count = 0
        for balance_obj in queryset:
            service.add_balance(
                user=balance_obj.user,
                amount=Decimal("100.00"),
                transaction_type="admin_credit",
                description=f"Admin credit by {request.user.username}",
            )
            count += 1
        self.message_user(request, f"Added 100 TEO to {count} users.")

    @admin.action(description="Subtract 50 TEO from selected users")
    def subtract_balance_action(self, request, queryset):
        """Subtract balance from selected users."""
        service = DBTeoCoinService()
        count = 0
        for balance_obj in queryset:
            if balance_obj.available_balance >= Decimal("50.00"):
                service.deduct_balance(
                    user=balance_obj.user,
                    amount=Decimal("50.00"),
                    transaction_type="admin_debit",
                    description=f"Admin debit by {request.user.username}",
                )
                count += 1
        self.message_user(request, f"Subtracted 50 TEO from {count} users.")

    @admin.action(description="Reset balance to 0 for selected users")
    def reset_balance_action(self, request, queryset):
        """Reset balance to zero for selected users."""
        count = 0
        for balance_obj in queryset:
            balance_obj.available_balance = Decimal("0.00")
            balance_obj.staked_balance = Decimal("0.00")
            balance_obj.pending_withdrawal = Decimal("0.00")
            balance_obj.save()
            count += 1
        self.message_user(request, f"Reset balance for {count} users.")


@admin.register(DBTeoCoinTransaction)
class DBTeoCoinTransactionAdmin(admin.ModelAdmin):
    """
    Admin configuration for DBTeoCoinTransaction model.
    Provides detailed transaction history and analytics.
    """

    list_display = (
        "id",
        "user_info",
        "transaction_type",
        "amount_display",
        "description",
        "created_at",
    )
    list_filter = ("transaction_type", "created_at", "user__role")
    # course_id is an integer/foreign-key column; using it in search_fields causes
    # admin to apply `__icontains` which raises FieldError. Remove it and rely
    # on description or related course fields if needed (e.g. course__title).
    search_fields = ("user__username", "user__email", "description")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Transaction Details",
            {"fields": ("user", "transaction_type", "amount", "description")},
        ),
        ("Course Information", {"fields": ("course_id",), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("created_at",)}),
    )

    @admin.display(description="User")
    def user_info(self, obj):
        """Display user info with role."""
        return format_html(
            "<strong>{}</strong><br><small>{}</small>",
            obj.user.get_full_name() or obj.user.username,
            obj.user.role.title(),
        )

    @admin.display(description="Amount", ordering="amount")
    def amount_display(self, obj):
        """Display amount with color coding."""
        color = "#198754" if obj.amount >= 0 else "#dc3545"
        symbol = "+" if obj.amount >= 0 else ""
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}{} TEO</span>',
            color,
            symbol,
            f"{obj.amount:.2f}",
        )

    def has_add_permission(self, request):
        """Prevent manual transaction creation."""
        return False

    def has_change_permission(self, request, obj=None):
        """Prevent transaction modification."""
        return False


@admin.register(TeoCoinWithdrawalRequest)
class TeoCoinWithdrawalRequestAdmin(admin.ModelAdmin):
    """
    Admin configuration for TeoCoinWithdrawalRequest model.
    Manages withdrawal requests to MetaMask wallets.
    """

    list_display = (
        "id",
        "user_info",
        "amount",
        "wallet_address_display",
        "status",
        "created_at",
        "completed_at",
    )
    list_filter = ("status", "created_at", "completed_at")
    search_fields = ("user__username", "user__email", "metamask_address")
    readonly_fields = ("created_at",)

    fieldsets = (
        ("Withdrawal Details", {"fields": ("user", "amount", "metamask_address")}),
        ("Processing", {"fields": ("status", "transaction_hash", "completed_at")}),
        ("Timestamps", {"fields": ("created_at",)}),
    )

    actions = ["approve_withdrawals", "reject_withdrawals"]

    @admin.display(description="User")
    def user_info(self, obj):
        """Display user info."""
        return format_html(
            "<strong>{}</strong><br><small>{}</small>",
            obj.user.get_full_name() or obj.user.username,
            obj.user.email,
        )

    @admin.display(description="Wallet Address")
    def wallet_address_display(self, obj):
        """Display shortened wallet address."""
        if obj.metamask_address:
            return format_html(
                "<code>{}</code>",
                f"{obj.metamask_address[:8]}...{obj.metamask_address[-6:]}",
            )
        return "-"

    @admin.action(description="Approve selected withdrawal requests")
    def approve_withdrawals(self, request, queryset):
        """Approve withdrawal requests."""
        count = queryset.filter(status="pending").update(status="approved")
        self.message_user(request, f"Approved {count} withdrawal requests.")

    @admin.action(description="Reject selected withdrawal requests")
    def reject_withdrawals(self, request, queryset):
        """Reject withdrawal requests."""
        count = queryset.filter(status="pending").update(status="rejected")
        self.message_user(request, f"Rejected {count} withdrawal requests.")


# Custom admin site configuration
admin.site.site_header = "TeoCoin Platform Administration"
admin.site.site_title = "TeoCoin Admin"
admin.site.index_title = "Welcome to TeoCoin Platform Administration"
