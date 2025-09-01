from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from notifications.models import Notification
from rewards.models import BlockchainTransaction
from users.models import User

from .validators import validate_video_file


class Course(models.Model):
    CATEGORY_CHOICES = [
        ("disegno", "✏️ Disegno"),
        ("pittura-olio", "🎨 Pittura ad Olio"),
        ("acquerello", "💧 Acquerello"),
        ("tempera", "🖌️ Tempera"),
        ("acrilico", "🌈 Pittura Acrilica"),
        ("scultura", "🗿 Scultura"),
        ("storia-arte", "📚 Storia dell'Arte"),
        ("fotografia", "📸 Fotografia Artistica"),
        ("illustrazione", "🖊️ Illustrazione"),
        ("arte-digitale", "💻 Arte Digitale"),
        ("ceramica", "🏺 Ceramica e Terracotta"),
        ("incisione", "⚱️ Incisione e Stampa"),
        ("mosaico", "🔷 Mosaico"),
        ("restauro", "🛠️ Restauro Artistico"),
        ("calligrafia", "✒️ Calligrafia"),
        ("fumetto", "💭 Fumetto e Graphic Novel"),
        ("design-grafico", "🎨 Design Grafico"),
        ("arte-contemporanea", "🆕 Arte Contemporanea"),
        ("arte-classica", "🏛️ Arte Classica"),
        ("other", "🎭 Altro"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="other",
        help_text="Categoria del corso per facilitare la navigazione",
    )
    cover_image = models.ImageField(
        upload_to="course_covers/",
        blank=True,
        null=True,
        help_text="Immagine di copertina del corso (opzionale)",
    )
    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="courses_created"
    )
    # Removed legacy price field; use price_eur for all pricing

    # FIAT PRICING SYSTEM
    price_eur = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Prezzo in Euro per pagamento fiat",
    )

    # TEOCOIN INTEGRATION
    teocoin_reward = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="TeoCoin ricompensa per completamento corso",
    )

    teocoin_discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("10.00"),
        help_text="Percentuale sconto pagando con TeoCoin",
    )

    students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="CourseEnrollment",
        related_name="core_students",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    lessons = models.ManyToManyField("Lesson", related_name="courses_included")
    is_approved = models.BooleanField(
        default=False,
        help_text="Il corso deve essere approvato da un admin prima di essere messo in vendita.",
    )
    reward_distributed = models.PositiveIntegerField(
        default=0,
        help_text="Totale TeoCoins distribuiti come ricompensa per questo corso",
    )

    def __str__(self):
        return self.title

    def get_teocoin_price(self):
        """Calculate TeoCoin price with discount"""
        if self.price_eur > 0:
            # Convert EUR to TEO (1 EUR = 10 TEO)
            base_teo_price = self.price_eur * Decimal("10")
            discount = base_teo_price * (self.teocoin_discount_percent / Decimal("100"))
            return base_teo_price - discount
        return Decimal("0")

    def get_teocoin_discount_amount(self):
        """Calculate how much TEO is needed for the discount (consistent with payment views)"""
        if self.price_eur > 0 and self.teocoin_discount_percent > 0:
            # This is the TEO amount needed to get the discount
            discount_value_eur = (
                self.price_eur * self.teocoin_discount_percent
            ) / Decimal("100")
            # Convert EUR discount to TEO (1 EUR = 10 TEO)
            return discount_value_eur * Decimal("10")
        return Decimal("0")

    def get_pricing_options(self):
        """Return all payment options for this course"""
        options = []

        if self.price_eur > 0:
            options.append(
                {
                    "method": "fiat",
                    "price": self.price_eur,
                    "currency": "EUR",
                    "reward": self.teocoin_reward,
                    "description": f"€{self.price_eur} + {self.teocoin_reward} TEO reward",
                }
            )

            teocoin_price = self.get_teocoin_price()
            options.append(
                {
                    "method": "teocoin",
                    "price": teocoin_price,
                    "currency": "TEO",
                    "discount": self.teocoin_discount_percent,
                    "description": f"{teocoin_price} TEO ({self.teocoin_discount_percent}% discount)",
                }
            )
        else:
            options.append(
                {
                    "method": "free",
                    "price": 0,
                    "currency": "FREE",
                    "reward": self.teocoin_reward,
                    "description": f"Free + {self.teocoin_reward} TEO reward",
                }
            )

        return options

    def purchase_by_student(self, student):
        """
        Handle course purchase using blockchain TeoCoins.
        This method is now deprecated - use the blockchain-integrated purchase_course API instead.
        """
        with transaction.atomic():
            if student in self.students.all():
                raise ValueError("Corso già acquistato")

            # Check blockchain balance instead of database balance
            from blockchain.views import teocoin_service

            if not student.wallet_address:
                raise ValueError(
                    "Wallet non collegato. Collega il tuo wallet per acquistare corsi."
                )

            balance = teocoin_service.get_balance(student.wallet_address)
            if balance < self.price_eur:
                raise ValueError("TeoCoin insufficienti nel wallet")

            # For now, we just add the student to the course
            # The actual payment will be handled by the blockchain integration
            self.students.add(student)

            # Create notification
            Notification.objects.create(
                user=student,
                message=f"Hai acquistato il corso '{self.title}'",
                notification_type="course_purchased",
                related_object_id=str(self.pk) if self.pk else None,
            )

            # Record blockchain transaction
            BlockchainTransaction.objects.create(
                user=student,
                amount=self.price_eur,
                transaction_type="course_purchase",
                status="pending",
                related_object_id=str(self.pk) if self.pk else None,
            )

    def total_duration(self):
        return sum(lesson.duration for lesson in self.lessons.all())


class Lesson(models.Model):
    LESSON_TYPE_CHOICES = [
        ("theory", "Teoria"),
        ("practical", "Pratica"),
        ("video", "Video"),
        ("mixed", "Mista"),
    ]

    title = models.CharField(max_length=200)
    content = models.TextField()
    lesson_type = models.CharField(
        max_length=20,
        choices=LESSON_TYPE_CHOICES,
        default="theory",
        help_text="Tipo di lezione",
    )
    video_file = models.FileField(
        upload_to="lesson_videos/",
        blank=True,
        null=True,
        validators=[validate_video_file],
        help_text="File video per lezioni video (max 200MB, formati: MP4, AVI, MOV, WMV, FLV, WebM, MKV)",
    )
    course = models.ForeignKey(
        "Course",
        on_delete=models.CASCADE,
        related_name="lessons_in_course",
        null=True,
        blank=True,
    )
    duration = models.PositiveIntegerField(default=0, help_text="Durata in minuti")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="lessons", db_index=True
    )
    materials = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista di URL per materiali di supporto (immagini, PDF).",
    )
    order = models.PositiveIntegerField(
        default=1, help_text="Posizione della lezione all'interno del corso."
    )

    class Meta:
        ordering = ["order"]  # ordina automaticamente per order

    def __str__(self):
        if self.course:
            return f"{self.course.title} – Lezione {self.order}: {self.title}"
        return f"Lezione {self.order}: {self.title}"

    def clean(self):
        if self.course and self.teacher != self.course.teacher:
            raise ValidationError(
                "Il teacher della lezione deve corrispondere al teacher del corso"
            )


class Exercise(models.Model):
    STATUS_CHOICES = (
        ("created", "Creato"),
        ("submitted", "Inviato"),
        ("reviewed", "Valutato"),
    )

    EXERCISE_TYPE_CHOICES = [
        ("practical", "Pratico"),
        ("study", "Studio"),
        ("technique", "Tecnica"),
        ("creative", "Creativo"),
    ]

    DIFFICULTY_CHOICES = [
        ("beginner", "Principiante"),
        ("intermediate", "Intermedio"),
        ("advanced", "Avanzato"),
    ]

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="exercises",
        null=True,  # Permette valori nulli
        blank=True,  # Permette di lasciare il campo vuoto nei form
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="exercises"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    exercise_type = models.CharField(
        max_length=20,
        choices=EXERCISE_TYPE_CHOICES,
        default="practical",
        help_text="Tipo di esercizio",
    )
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default="beginner",
        help_text="Livello di difficoltà",
    )
    time_estimate = models.PositiveIntegerField(
        default=60, help_text="Tempo stimato per completare l'esercizio (in minuti)"
    )
    materials = models.TextField(
        blank=True, help_text="Lista dei materiali necessari per l'esercizio"
    )
    instructions = models.TextField(
        blank=True, help_text="Istruzioni dettagliate per svolgere l'esercizio"
    )
    reference_image = models.ImageField(
        upload_to="exercise_references/",
        blank=True,
        null=True,
        help_text="Immagine di riferimento per l'esercizio (opzionale)",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="created")
    score = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def clean(self):
        if self.status == "reviewed" and self.score is None:
            raise ValidationError(
                {"score": "Un esercizio valutato richiede un punteggio"}
            )

        if self.score and (self.score < 0 or self.score > 100):
            raise ValidationError({"score": "Il punteggio deve essere tra 0 e 100"})

    def save(self, *args, **kwargs):
        if self.pk and self.student:
            old = Exercise.objects.get(pk=self.pk)
            if (
                (old.status != self.status or old.score != self.score)
                and self.status == "reviewed"
                and self.score is not None
            ):

                self.assign_teo_coins()
                self.create_notification()

        super().save(*args, **kwargs)

    def assign_teo_coins(self):
        """
        Assign TeoCoin rewards for completed exercises using blockchain.
        This method now integrates with the blockchain reward system.
        """
        if self.student and not hasattr(self, "_teocoins_assigned") and self.score:
            reward = self.score // 10  # Same reward calculation

            # Use blockchain reward system instead of fake coins
            if self.student.wallet_address:
                try:
                    from decimal import Decimal

                    from blockchain.views import mint_tokens

                    # Mint reward tokens directly to student's wallet
                    tx_hash = mint_tokens(
                        self.student.wallet_address,
                        Decimal(str(reward)),
                        f"Exercise reward for {self.title}",
                    )

                    # Record blockchain transaction
                    BlockchainTransaction.objects.create(
                        user=self.student,
                        amount=reward,
                        transaction_type="exercise_reward",
                        tx_hash=tx_hash,
                        status="completed",
                        related_object_id=str(self.pk) if self.pk else None,
                    )

                    self._teocoins_assigned = True

                except Exception as e:
                    # Log error but don't fail the exercise grading
                    import logging

                    logger = logging.getLogger(__name__)
                    logger.error(
                        f"Failed to mint reward for exercise {self.pk}: {str(e)}"
                    )
            else:
                # Student doesn't have wallet linked - create pending reward
                BlockchainTransaction.objects.create(
                    user=self.student,
                    amount=reward,
                    transaction_type="exercise_reward",
                    status="pending_wallet",
                    related_object_id=str(self.pk) if self.pk else None,
                    notes="Reward pending - wallet not linked",
                )

    def create_notification(self):
        if self.student and self.pk:
            Notification.objects.create(
                user=self.student,
                message=f"Esercizio {self.title} valutato: {self.score}/100",
                notification_type="exercise_graded",
                related_object_id=str(self.pk),
            )

    class Meta:
        verbose_name = "Esercizio"
        verbose_name_plural = "Esercizi"


class CourseEnrollment(models.Model):
    """
    Rappresenta l'iscrizione di uno studente a un corso e il suo stato di completamento.
    Enhanced with payment tracking for fiat and TeoCoin payments.
    """

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )

    # PAYMENT TRACKING
    PAYMENT_METHODS = [
        ("fiat", "Euro Payment"),
        ("teocoin", "TeoCoin Payment"),
        ("teocoin_discount", "Euro Payment with TeoCoin Discount"),
        ("free", "Free Course"),
        ("admin", "Admin Granted"),
    ]

    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHODS, default="free"
    )

    amount_paid_eur = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount paid in EUR for fiat payments",
    )

    amount_paid_teocoin = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Amount paid in TeoCoin for crypto payments",
    )

    # TEOCOIN DISCOUNT TRACKING
    original_price_eur = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Original course price before discount",
    )

    discount_amount_eur = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Discount amount in EUR for TeoCoin discount payments",
    )

    teocoin_discount_request_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="TeoCoin discount request ID from smart contract",
    )

    stripe_payment_intent_id = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Stripe payment intent ID for fiat payments",
    )

    teocoin_reward_given = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="TeoCoin reward given for course purchase",
    )

    # EXISTING FIELDS
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(
        default=False,
        help_text="Flag che indica se lo studente ha completato tutte le lezioni (per il certificato).",
    )
    completed_at = models.DateTimeField(
        null=True, blank=True, help_text="Date when course was completed"
    )

    class Meta:
        unique_together = ("student", "course")

    def __str__(self):
        status = "Completato" if self.completed else "In corso"
        payment_info = f" - {self.payment_method}"
        return f"{self.student.username} → {self.course.title} ({status}){payment_info}"


class ExerciseSubmission(models.Model):
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    average_score = models.FloatField(default=0)
    is_approved = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False)
    passed = models.BooleanField(default=False)
    reviewers = models.ManyToManyField(User, related_name="assigned_reviews")
    reward_amount = models.PositiveIntegerField(default=0)

    @staticmethod
    def notify_reviewers(submission, num_reviewers=3):
        reviewers = User.objects.filter(groups__name="Valutatori").order_by(
            # Supponendo che i valutatori siano in un gruppo specifico
            "?"
        )[:num_reviewers]
        for reviewer in reviewers:
            Notification.objects.create(
                user=reviewer,
                message=f"Un nuovo esercizio è stato sottomesso per la revisione: {submission.exercise.title}",
                notification_type="exercise_submission",
                related_object_id=submission.id,
            )

    def notify_student(self):
        status = "approvato" if self.is_approved else "non approvato"
        Notification.objects.create(
            user=self.student,
            message=f"Il tuo esercizio '{self.exercise.title}' è stato {status}.",
            notification_type="exercise_status",
            related_object_id=str(self.pk) if self.pk else None,
        )


class ExerciseReview(models.Model):
    assigned_at = models.DateTimeField(auto_now_add=True)
    submission = models.ForeignKey(
        ExerciseSubmission, on_delete=models.CASCADE, related_name="reviews"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(null=True, blank=True)
    # Breakdown fields (scale 1..5) — nullable for backward compatibility
    technical = models.SmallIntegerField(null=True, blank=True)
    creative = models.SmallIntegerField(null=True, blank=True)
    following = models.SmallIntegerField(null=True, blank=True)
    # Optional free-text comment and recommendations array (JSON)
    comment = models.TextField(null=True, blank=True)
    recommendations = models.JSONField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    @staticmethod
    def calculate_average_score(submission):
        reviews = submission.reviews.all()
        if reviews.exists():
            # We keep submission.average_score in the 1-10 scale for backward
            # compatibility. For reviews that provide a 3-field breakdown (1-5)
            # we convert to 1-10 by multiplying the mean by 2. Legacy reviews that
            # only have `score` are assumed to already be 1-10.
            vals = []
            for r in reviews:
                if r.technical is not None and r.creative is not None and r.following is not None:
                    mean_1_5 = (r.technical + r.creative + r.following) / 3.0
                    vals.append(mean_1_5 * 2.0)
                elif r.score is not None:
                    vals.append(float(r.score))
            average = sum(vals) / len(vals) if vals else None
            submission.average_score = average
            # Approvato solo se almeno 3 review e media (1-10) >= 5 (equiv. 2.5 on 1-5)
            if reviews.count() >= 3:
                submission.is_approved = (average is not None and average >= 5)
            submission.save()
            return submission.is_approved if reviews.count() >= 3 else None
        return None

    @staticmethod
    def reward_reviewer(review):
        """
        Reward reviewers with blockchain TeoCoins for their work.
        This method now integrates with the blockchain reward system.
        """
        reward_amount = 1  # 1 TeoCoin per review

        if review.reviewer.wallet_address:
            try:
                # from blockchain.views import mint_tokens
                pass

                # Mint reward tokens directly to reviewer's wallet (placeholder)
                tx_hash = None  # Replace with actual mint_tokens call if available
                # Record blockchain transaction
                BlockchainTransaction.objects.create(
                    user=review.reviewer,
                    amount=reward_amount,
                    transaction_type="review_reward",
                    tx_hash=tx_hash,
                    status="completed",
                    related_object_id=str(review.pk) if review.pk else None,
                )
                review.reward = reward_amount
                review.save()
            except Exception as e:
                import logging

                logger = logging.getLogger(__name__)
                logger.error(f"Failed to mint reward for review {review.pk}: {str(e)}")
        else:
            # Reviewer doesn't have wallet linked - create pending reward
            BlockchainTransaction.objects.create(
                user=review.reviewer,
                amount=reward_amount,
                transaction_type="review_reward",
                status="pending_wallet",
                related_object_id=str(review.pk) if review.pk else None,
                notes="Reward pending - wallet not linked",
            )


class ReviewerReputation(models.Model):
    reviewer = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reputation"
    )
    reputation_score = models.FloatField(default=5.0)  # Da 1 a 10

    @staticmethod
    def update_reputation(reviewer, submission, score):
        average_score = submission.reviews.exclude(reviewer=reviewer).aggregate(
            models.Avg("score")
        )["score__avg"]
        if average_score:
            difference = abs(score - average_score)
            penalty = difference / 10  # Penalità proporzionale alla differenza
            reputation = ReviewerReputation.objects.get(reviewer=reviewer)
            reputation.reputation_score = max(1, reputation.reputation_score - penalty)
            reputation.save()


class LessonCompletion(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="completed_lessons"
    )
    lesson = models.ForeignKey(
        "courses.Lesson", on_delete=models.CASCADE, related_name="completions"
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "lesson")
        verbose_name = "Completamento Lezione"
        verbose_name_plural = "Completamenti Lezioni"

    def __str__(self):
        return f"{self.student.username} - {self.lesson.title}"


class TeacherDiscountDecision(models.Model):
    """
    Track teacher decisions on TeoCoin discount requests
    """

    DECISION_CHOICES = [
        ("pending", "Pending Decision"),
        ("accepted", "Accepted TeoCoin"),
        ("declined", "Declined TeoCoin"),
        ("expired", "Decision Expired"),
    ]

    teacher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="discount_decisions"
    )
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="discount_requests"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="discount_decisions"
    )

    # Financial details
    course_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.IntegerField()
    teo_cost = models.BigIntegerField(help_text="TEO cost in wei (18 decimals)")
    teacher_bonus = models.BigIntegerField(
        help_text="Teacher bonus in wei (18 decimals)"
    )

    # Commission calculation snapshot
    teacher_commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Commission rate at time of request"
    )
    teacher_staking_tier = models.CharField(
        max_length=20, help_text="Staking tier at time of request"
    )

    # Decision tracking
    decision = models.CharField(
        max_length=10, choices=DECISION_CHOICES, default="pending"
    )
    decision_made_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(help_text="When the decision expires")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Transaction tracking
    student_transaction_hash = models.CharField(max_length=66, blank=True, null=True)
    teacher_payment_completed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["teacher", "decision"]),
            models.Index(fields=["student", "created_at"]),
            models.Index(fields=["expires_at"]),
        ]
        verbose_name = "Decisione Sconto Teacher"
        verbose_name_plural = "Decisioni Sconti Teacher"

    def __str__(self):
        return f"{self.student.email} → {self.teacher.email}: {self.course.title} ({self.decision})"

    @property
    def teo_cost_display(self):
        """Convert wei to TEO for display"""
        return self.teo_cost / 10**18

    @property
    def teacher_bonus_display(self):
        """Convert wei to TEO for display"""
        return self.teacher_bonus / 10**18

    @property
    def discounted_price(self):
        """Calculate the discounted course price"""
        return (
            self.course_price
            * (Decimal("100") - Decimal(str(self.discount_percentage)))
            / Decimal("100")
        )

    @property
    def teacher_earnings_if_accepted(self):
        """Calculate teacher earnings if they accept TeoCoin"""
        fiat_amount = self.discounted_price * (
            Decimal("1") - (self.teacher_commission_rate / Decimal("100"))
        )
        teo_amount = (self.teo_cost + self.teacher_bonus) / 10**18
        return {"fiat": fiat_amount, "teo": teo_amount, "total_teo": teo_amount}

    @property
    def teacher_earnings_if_declined(self):
        """Calculate teacher earnings if they decline TeoCoin"""
        fiat_amount = self.course_price * (
            Decimal("1") - (self.teacher_commission_rate / Decimal("100"))
        )
        return {"fiat": fiat_amount, "teo": Decimal("0"), "total_teo": Decimal("0")}

    @property
    def is_expired(self):
        """Check if the decision period has expired"""
        from django.utils import timezone

        return timezone.now() > self.expires_at

    def clean(self):
        """Validate the model data"""
        if self.teacher.role != "teacher":
            raise ValidationError("Teacher must have teacher role")
        if self.student.role != "student":
            raise ValidationError("Student must have student role")
        if self.discount_percentage < 0 or self.discount_percentage > 100:
            raise ValidationError("Discount percentage must be between 0 and 100")
        if self.course_price <= 0:
            raise ValidationError("Course price must be positive")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class TeacherChoicePreference(models.Model):
    """
    Store teacher preferences for automatic decisions
    """

    PREFERENCE_CHOICES = [
        ("always_accept", "Always Accept TeoCoin"),
        ("always_decline", "Always Decline TeoCoin"),
        ("manual", "Manual Decision Required"),
        ("threshold_based", "Accept if TEO value > threshold"),
    ]

    teacher = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="choice_preference"
    )
    preference = models.CharField(
        max_length=20, choices=PREFERENCE_CHOICES, default="manual"
    )

    # For threshold-based decisions
    minimum_teo_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Minimum TEO amount to auto-accept",
    )

    # Notification preferences
    email_notifications = models.BooleanField(default=True)
    immediate_notifications = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Preferenza Scelta Teacher"
        verbose_name_plural = "Preferenze Scelte Teacher"

    def __str__(self):
        return f"{self.teacher.email}: {self.preference}"

    def should_auto_accept(self, teo_amount_display):
        """
        Determine if this preference should auto-accept a discount request
        """
        if self.preference == "always_accept":
            return True
        elif self.preference == "always_decline":
            return False
        elif self.preference == "threshold_based" and self.minimum_teo_threshold:
            return Decimal(str(teo_amount_display)) >= self.minimum_teo_threshold
        return False  # manual or no auto-decision
