from rest_framework import serializers
from users.serializers import UserSerializer

from .models import (
    Course,
    CourseEnrollment,
    Exercise,
    ExerciseSubmission,
    Lesson,
    TeacherChoicePreference,
    TeacherDiscountDecision,
)


class LessonListSerializer(serializers.ModelSerializer):
    exercises_count = serializers.SerializerMethodField()
    completed = serializers.SerializerMethodField()
    lesson_type_display = serializers.CharField(
        source="get_lesson_type_display", read_only=True
    )

    class Meta:
        model = Lesson
        fields = [
            "id",
            "completed",
            "title",
            "order",
            "duration",
            "lesson_type",
            "lesson_type_display",
            "exercises_count",
        ]

    def get_exercises_count(self, obj):
        return obj.exercises.count()

    def get_completed(self, obj):
        # Return whether the requesting user has completed this lesson
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return False
        try:
            from courses.models import LessonCompletion

            return LessonCompletion.objects.filter(student=request.user, lesson=obj).exists()
        except Exception:
            return False


class ExerciseSubmissionSerializer(serializers.ModelSerializer):
    average_score = serializers.FloatField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    reviewed = serializers.BooleanField(read_only=True)
    passed = serializers.BooleanField(read_only=True)
    reviews = serializers.SerializerMethodField()
    exercise = serializers.SerializerMethodField()
    exercise_id = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    text = serializers.SerializerMethodField()
    student = serializers.SerializerMethodField()
    reward_amount = serializers.IntegerField(read_only=True)

    class Meta:
        model = ExerciseSubmission
        fields = [
            "id",
            "exercise",
            "exercise_id",
            "title",
            "content",
            "text",
            "created_at",
            "average_score",
            "is_approved",
            "reviewed",
            "passed",
            "reviews",
            "reward_amount",
        ]

    def get_exercise(self, obj):
        if obj.exercise:
            return {
                "id": obj.exercise.id,
                "title": obj.exercise.title,
                "description": obj.exercise.description,
                "difficulty": obj.exercise.difficulty,
                "time_estimate": obj.exercise.time_estimate,
                "materials": obj.exercise.materials,
                "instructions": obj.exercise.instructions,
                "exercise_type": obj.exercise.exercise_type,
            }
        return None

    # Additional helper fields for frontend compatibility
    def get_exercise_id(self, obj):
        return obj.exercise.id if obj.exercise else None

    def get_title(self, obj):
        return obj.exercise.title if obj.exercise else None

    def get_text(self, obj):
        return obj.content

    def get_reviews(self, obj):
        result = []
        for r in obj.reviews.all():
            result.append(
                {
                    "id": getattr(r, "id", None),
                    "reviewer": r.reviewer.username if getattr(r, "reviewer", None) else None,
                    "reviewer_id": getattr(r.reviewer, "id", None) if getattr(r, "reviewer", None) else None,
                    "score": r.score,
                    "technical": getattr(r, "technical", None),
                    "creative": getattr(r, "creative", None),
                    "following": getattr(r, "following", None),
                    "comment": getattr(r, "comment", None),
                    "recommendations": getattr(r, "recommendations", None),
                    "reviewed_at": r.reviewed_at,
                }
            )
        return result

    def get_student(self, obj):
        if getattr(obj, "student", None):
            return {"id": obj.student.id, "name": getattr(obj.student, "username", None)}
        return None

    def validate(self, attrs):
        # Verifica che il contenuto non sia vuoto
        if not attrs.get("content"):
            raise serializers.ValidationError(
                {"content": "Il contenuto della sottomissione è obbligatorio."}
            )
        return attrs


class TeacherLessonSerializer(serializers.ModelSerializer):
    total_students = serializers.SerializerMethodField()
    total_earnings = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ["id", "title", "total_students", "total_earnings"]

    def get_total_students(self, obj):
        return obj.students.count()

    def get_total_earnings(self, obj):
        return obj.price_eur * obj.students.count() * 0.9  # 10% fee to platform


class TeacherCourseSerializer(serializers.ModelSerializer):
    total_earnings = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()
    enrolled_students = serializers.SerializerMethodField()
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    cover_image_url = serializers.SerializerMethodField()
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "price_eur",
            "category",
            "category_display",
            "cover_image",
            "cover_image_url",
            "is_approved",
            # Compatibility fields for frontend status
            "published",
            "status",
            "created_at",
            "updated_at",
            "total_earnings",
            "total_students",
            "enrolled_students",
            "lessons",
        ]

    def get_total_earnings(self, obj):
        from decimal import Decimal

        return str(obj.price_eur * obj.students.count() * Decimal("0.9"))

    def get_total_students(self, obj):
        return obj.students.count()

    def get_enrolled_students(self, obj):
        return obj.students.count()

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
        return None

    def get_lessons(self, obj):
        # Restituisce le lezioni del corso con informazioni di base
        lessons = obj.lessons.all().order_by("order", "created_at")
        lesson_data = []
        for lesson in lessons:
            lesson_data.append(
                {
                    "id": lesson.id,
                    "title": lesson.title,
                    "description": (
                        lesson.content[:100] + "..."
                        if lesson.content and len(lesson.content) > 100
                        else lesson.content
                    ),
                    "duration": lesson.duration,
                    "order": lesson.order,
                    "lesson_type": lesson.lesson_type,
                    "created_at": lesson.created_at,
                    "exercises_count": lesson.exercises.count(),
                    "course_id": obj.id,  # Aggiungiamo esplicitamente il course_id
                    "course": obj.id,  # Per compatibilità
                }
            )
        return lesson_data

    # Provide compatibility fields expected by frontend
    published = serializers.BooleanField(source="is_approved", read_only=True)
    status = serializers.SerializerMethodField()

    def get_status(self, obj):
        return "published" if getattr(obj, "is_approved", False) else "draft"


class LessonSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(source="course.id", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    lesson_type_display = serializers.CharField(
        source="get_lesson_type_display", read_only=True
    )
    video_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "title",
            "content",
            "lesson_type",
            "lesson_type_display",
            "video_file",
            "video_file_url",
            "course",
            "duration",
            "teacher",
            "materials",
            "order",
            "created_at",
            "course_id",
            "course_title",
        ]
        read_only_fields = ["id", "created_at", "teacher"]

    def get_video_file_url(self, obj):
        if obj.video_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.video_file.url)
        return None

    def validate_course(self, value):
        if value and value.teacher != self.context["request"].user:
            raise serializers.ValidationError("Non sei il teacher di questo corso")
        return value


class ExerciseSerializer(serializers.ModelSerializer):
    exercise_type_display = serializers.CharField(
        source="get_exercise_type_display", read_only=True
    )
    difficulty_display = serializers.CharField(
        source="get_difficulty_display", read_only=True
    )
    reference_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Exercise
        fields = [
            "id",
            "title",
            "description",
            "lesson",
            "exercise_type",
            "exercise_type_display",
            "difficulty",
            "difficulty_display",
            "time_estimate",
            "materials",
            "instructions",
            "reference_image",
            "reference_image_url",
            "status",
            "score",
            "feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "score",
            "feedback",
            "status",
        ]

    def get_reference_image_url(self, obj):
        if obj.reference_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.reference_image.url)
        return None

    def validate_lesson(self, value):
        # Verifica che la lezione appartenga al corso del teacher
        if value.course.teacher != self.context["request"].user:
            raise serializers.ValidationError(
                "Non sei il proprietario del corso associato a questa lezione."
            )
        return value


class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    teacher = UserSerializer(read_only=True)
    total_duration = serializers.SerializerMethodField()
    students = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    is_approved = serializers.BooleanField(read_only=True)
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    student_count = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    teocoin_price = serializers.SerializerMethodField()
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, source="price_eur", required=False
    )

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "category",
            "category_display",
            "cover_image",
            "cover_image_url",
            "price",
            "price_eur",
            "teocoin_price",
            "teocoin_discount_percent",
            "teocoin_reward",
            "teacher",
            "lessons",
            "total_duration",
            "students",
            "student_count",
            "created_at",
            "updated_at",
            "is_enrolled",
            "is_approved",
        ]
        read_only_fields = ["teacher", "students"]
        extra_kwargs = {"lessons": {"read_only": True}}

    def get_teocoin_price(self, obj):
        return obj.get_teocoin_price() if hasattr(obj, "get_teocoin_price") else None

    # Removed validate_price since 'price' field is gone

    def get_total_duration(self, obj):
        return sum(lesson.duration for lesson in obj.lessons.all())

    def get_is_enrolled(self, obj):
        user = self.context["request"].user
        return obj.students.filter(pk=user.pk).exists()

    def get_student_count(self, obj):

        return obj.students.count()

    def get_cover_image_url(self, obj):

        if obj.cover_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)
    course = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = [
            "id",
            "student",
            "course",
            "enrolled_at",
            "completed",
        ]
        read_only_fields = ["id", "student", "course", "enrolled_at", "completed"]


class StudentCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "description", "price_eur"]


class TeacherDiscountDecisionSerializer(serializers.ModelSerializer):
    """
    Serializer for teacher discount decisions
    """

    student_email = serializers.CharField(source="student.email", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    teo_cost_display = serializers.DecimalField(
        max_digits=10, decimal_places=4, read_only=True
    )
    teacher_bonus_display = serializers.DecimalField(
        max_digits=10, decimal_places=4, read_only=True
    )
    discounted_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    teacher_earnings_if_accepted = serializers.SerializerMethodField()
    teacher_earnings_if_declined = serializers.SerializerMethodField()
    # Compatibility fields for frontend: offer and final accepted teo values
    offered_teacher_teo = serializers.SerializerMethodField()
    final_teacher_teo = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    time_remaining = serializers.SerializerMethodField()

    class Meta:
        model = TeacherDiscountDecision
        fields = [
            "id",
            "student_email",
            "course_title",
            "course_price",
            "discount_percentage",
            "teo_cost_display",
            "teacher_bonus_display",
            "discounted_price",
            "teacher_commission_rate",
            "teacher_staking_tier",
            "decision",
            "decision_made_at",
            "expires_at",
            "created_at",
            "is_expired",
            "time_remaining",
            "teacher_earnings_if_accepted",
            "teacher_earnings_if_declined",
            "offered_teacher_teo",
            "final_teacher_teo",
        ]
        read_only_fields = [
            "id",
            "student_email",
            "course_title",
            "created_at",
            "teo_cost_display",
            "teacher_bonus_display",
            "discounted_price",
            "is_expired",
            "offered_teacher_teo",
            "final_teacher_teo",
        ]

    def get_teacher_earnings_if_accepted(self, obj):
        return obj.teacher_earnings_if_accepted

    def get_teacher_earnings_if_declined(self, obj):
        return obj.teacher_earnings_if_declined

    def get_offered_teacher_teo(self, obj):
        """Return the offered TEO for the teacher as a string with 8 d.p.

        Preference: use the decision calculation; this mirrors the snapshot
        offered_teacher_teo value and guarantees the frontend always has a
        consistent string formatted amount.
        """
        try:
            # Only expose when pending
            if getattr(obj, "decision", None) != "pending":
                return None

            from decimal import Decimal

            # Primary source: try snapshot confirm-time value (authoritative)
            try:
                from rewards.models import PaymentDiscountSnapshot
                from rewards.serializers import PaymentDiscountSnapshotSerializer

                snap = (
                    PaymentDiscountSnapshot.objects.filter(
                        teacher=obj.teacher, student=obj.student, course=obj.course
                    )
                    .order_by("-created_at")
                    .first()
                )
                # Prefer the serializer's computed offered_teacher_teo when present
                if snap:
                    try:
                        snap_ser = PaymentDiscountSnapshotSerializer(snap).data
                        offered = snap_ser.get("offered_teacher_teo")
                        if offered is not None:
                            return str(Decimal(str(offered)).quantize(Decimal("0.00000001")))
                    except Exception:
                        # ignore and fallback
                        pass
                    # Fallback: if snapshot.teacher_teo numeric field is non-zero, use it
                    if getattr(snap, "teacher_teo", None) is not None:
                        snap_val = Decimal(str(getattr(snap, "teacher_teo")))
                        if snap_val and snap_val != Decimal("0"):
                            return str(snap_val.quantize(Decimal("0.00000001")))
            except Exception:
                # ignore snapshot lookup errors and fall back to decision calculation
                pass
            # If snapshot missing or zero, recompute the offered TEO from
            # the original inputs (course_price, discount_percentage and
            # tier-related fields) using the discount calculator. This
            # avoids relying on `teo_cost`/wei stored on the decision which
            # may have been capped to MAX_INT64 and thus display ~9.22337204.
            try:
                from services.discount_calc import compute_discount_breakdown

                # Build a lightweight tier dict when possible
                tier = None
                try:
                    if getattr(obj, "teacher_staking_tier", None):
                        tier = {
                            "teacher_split_percent": getattr(obj, "teacher_commission_rate", None),
                            "platform_split_percent": None,
                            "max_accept_discount_ratio": None,
                            "teo_bonus_multiplier": None,
                            "name": getattr(obj, "teacher_staking_tier", None),
                        }
                except Exception:
                    tier = None

                recomputed = compute_discount_breakdown(
                    price_eur=getattr(obj, "course_price", None),
                    discount_percent=getattr(obj, "discount_percentage", 0),
                    tier=tier,
                    accept_teo=True,
                    accept_ratio=None,
                )
                if recomputed and recomputed.get("teacher_teo") is not None:
                    return str(Decimal(str(recomputed.get("teacher_teo"))).quantize(Decimal("0.00000001")))
            except Exception:
                # Final fallback: try to use the decision-calculated value
                try:
                    teo = obj.teacher_earnings_if_accepted.get("teo")
                    teo_d = Decimal(str(teo)) if teo is not None else None
                    if teo_d is None:
                        return None
                    return str(teo_d.quantize(Decimal("0.00000001")))
                except Exception:
                    return None
        except Exception:
            from decimal import Decimal
            # On unexpected errors, prefer returning None so FE can log and
            # avoid rendering a spurious zero value.
            return None

    def get_final_teacher_teo(self, obj):
        """Return final teacher TEO after accept.

        If decision is accepted, prefer the immutable PaymentDiscountSnapshot
        teacher_accepted_teo when available; fallback to the decision
        calculation.
        """
        try:
            from decimal import Decimal
            from rewards.models import PaymentDiscountSnapshot

            # Only expose when accepted; use None for pending/declined
            if obj.decision == "accepted":
                snap = (
                    PaymentDiscountSnapshot.objects.filter(
                        teacher=obj.teacher, student=obj.student, course=obj.course
                    )
                    .order_by("-created_at")
                    .first()
                )
                if snap and getattr(snap, "teacher_accepted_teo", None) is not None:
                    return str(Decimal(str(snap.teacher_accepted_teo)).quantize(Decimal("0.00000001")))

            # Fallback to decision calculation
            if obj.decision == "accepted":
                teo = obj.teacher_earnings_if_accepted.get("teo")
                if teo is None:
                    return str(Decimal("0").quantize(Decimal("0.00000001")))
                return str(Decimal(str(teo)).quantize(Decimal("0.00000001")))

            # For declined or pending, return None so FE shows placeholder
            return None
        except Exception:
            from decimal import Decimal

            # On unexpected errors, return None to avoid misleading 0 values
            return None

    def get_time_remaining(self, obj):
        if obj.is_expired:
            return "Expired"

        from django.utils import timezone

        remaining = obj.expires_at - timezone.now()
        hours = remaining.total_seconds() / 3600

        if hours < 1:
            minutes = remaining.total_seconds() / 60
            return f"{int(minutes)} minutes"
        elif hours < 24:
            return f"{int(hours)} hours"
        else:
            days = hours / 24
            return f"{int(days)} days"


class TeacherChoicePreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for teacher choice preferences
    """

    teacher_email = serializers.CharField(source="teacher.email", read_only=True)
    preference_display = serializers.CharField(
        source="get_preference_display", read_only=True
    )

    class Meta:
        model = TeacherChoicePreference
        fields = [
            "id",
            "teacher_email",
            "preference",
            "preference_display",
            "minimum_teo_threshold",
            "email_notifications",
            "immediate_notifications",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "teacher_email", "created_at", "updated_at"]

    def validate_minimum_teo_threshold(self, value):
        """Validate threshold is positive if provided"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("Threshold must be positive")
        return value
