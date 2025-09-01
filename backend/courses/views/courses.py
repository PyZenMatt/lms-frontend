import logging

from courses.models import Course
from courses.serializers import CourseSerializer
from django.contrib.auth import get_user_model
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters as drf_filters
from rest_framework import generics, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from services.course_service import course_service
from services.exceptions import CourseNotFoundError, TeoArtServiceException
from users.permissions import IsAdminOrApprovedTeacherOrReadOnly, IsTeacher
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrApprovedTeacherOrReadOnly]

    def get_queryset(self):
        # ✅ OTTIMIZZATO - Prevent N+1 queries with select_related and prefetch_related
        return (
            Course.objects.select_related("teacher")
            .prefetch_related("students", "lessons", "enrollments")
            .annotate(student_count=models.Count("students"))
        )


class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrApprovedTeacherOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        drf_filters.SearchFilter,
        drf_filters.OrderingFilter,
    ]
    filterset_fields = ["teacher", "price_eur", "category"]
    search_fields = ["title", "description", "teacher__username"]
    ordering_fields = ["created_at", "price_eur", "student_count"]
    ordering = ["-created_at"]  # Default ordering by newest

    def get_queryset(self):
        # Mostra solo corsi approvati per utenti non admin
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admin può vedere tutti i corsi
            queryset = Course.objects.all()
        else:
            # Altri utenti vedono solo corsi approvati
            queryset = Course.objects.filter(is_approved=True)

        queryset = queryset.annotate(
            student_count=models.Count("students")
        ).prefetch_related("students", "teacher", "lessons")

        # Filtro per categoria se specificato tramite query params
        category = self.request.GET.get("category")
        if category:
            queryset = queryset.filter(category=category)

        return queryset

    def perform_create(self, serializer):
        try:
            user = self.request.user
            if getattr(user, "role", None) != "teacher":
                raise PermissionDenied("Solo i maestri possono creare corsi")

            User = get_user_model()
            user_obj = User.objects.get(pk=user.pk)
            if not getattr(user_obj, "is_approved", False):
                raise PermissionDenied(
                    "Solo i teacher approvati possono creare corsi. Aspetta l'approvazione dell'admin."
                )

            serializer.save(teacher=user_obj)
        except PermissionDenied:
            raise  # Re-raise permission errors
        except Exception as e:
            logger.error(f"Error in perform_create: {e}")
            raise


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrApprovedTeacherOrReadOnly]
    queryset = Course.objects.all()

    def get_object(self):
        try:
            obj = super().get_object()
            user = self.request.user

            # Admin può vedere tutto
            if user.is_staff or user.is_superuser:
                return obj

            # Teacher può vedere i propri corsi anche se non approvati
            if hasattr(user, "role") and user.role == "teacher" and obj.teacher == user:
                return obj

            # Altri utenti possono vedere solo corsi approvati
            if not obj.is_approved:
                raise PermissionDenied("Corso non approvato")

            return obj
        except Exception as e:
            logger.error(f"Error in get_object: {e}")
            raise

    def perform_update(self, serializer):
        try:
            if serializer.instance.teacher != self.request.user:
                raise PermissionDenied("Non sei il proprietario di questo corso")
            serializer.save()
        except PermissionDenied:
            raise  # Re-raise permission errors
        except Exception as e:
            logger.error(f"Error in perform_update: {e}")
            raise


class CreateCourseAPI(generics.CreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsTeacher]

    def perform_create(self, serializer):
        try:
            serializer.save(teacher=self.request.user)
        except Exception as e:
            logger.error(f"Error in CreateCourseAPI perform_create: {e}")
            raise


class CourseListAPIView(generics.ListAPIView):
    """
    API view for listing courses using CourseService
    """

    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            courses_data = course_service.get_available_courses(user=request.user)
            return Response(
                {"courses": courses_data, "count": len(courses_data), "success": True}
            )
        except TeoArtServiceException as e:
            logger.warning(f"Service error in CourseListAPIView: {e}")
            return Response(
                {"error": str(e)},
                status=(
                    e.status_code
                    if hasattr(e, "status_code")
                    else status.HTTP_400_BAD_REQUEST
                ),
            )
        except Exception as e:
            logger.error(f"Unexpected error in CourseListAPIView: {e}")
            return Response(
                {"error": "An error occurred while retrieving courses"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CourseDetailAPIView(generics.RetrieveAPIView):
    """
    API view for course details using CourseService
    """

    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        course_id = kwargs.get("pk")
        try:
            if not course_id:
                return Response(
                    {"error": "Course ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            course_details = course_service.get_course_details(
                int(course_id), user=request.user
            )
            return Response({**course_details, "success": True})
        except (ValueError, TypeError):
            logger.warning(f"Invalid course ID: {course_id}")
            return Response(
                {"error": "Invalid course ID"}, status=status.HTTP_400_BAD_REQUEST
            )
        except CourseNotFoundError:
            logger.info(f"Course not found: {course_id}")
            return Response(
                {"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except TeoArtServiceException as e:
            logger.warning(f"Service error in CourseDetailAPIView: {e}")
            return Response(
                {"error": str(e)},
                status=(
                    e.status_code
                    if hasattr(e, "status_code")
                    else status.HTTP_400_BAD_REQUEST
                ),
            )
        except Exception as e:
            logger.error(f"Unexpected error in CourseDetailAPIView: {e}")
            return Response(
                {"error": "An error occurred while retrieving course details"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CourseOutlineAPIView(generics.RetrieveAPIView):
    """
    New endpoint returning course outline + progress in a single payload.

    GET /api/v1/courses/{course_id}/outline?include_progress=1
    """
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        course_id = kwargs.get("course_id") or kwargs.get("pk")
        include_progress = request.GET.get("include_progress") in ("1", "true", "True")
        try:
            if not course_id:
                return Response({"error": "Course ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Reuse existing service which already computes lessons and per-user completion
            details = course_service.get_course_details(int(course_id), user=request.user if include_progress else None)

            # Compute enrollment_status
            from courses.models import CourseEnrollment

            enrolled = CourseEnrollment.objects.filter(student=request.user, course_id=course_id).exists()
            enrollment_status = "enrolled" if enrolled else "not_enrolled"

            # Build normalized payload using DB to compute sequential unlocking and exercise status
            from courses.models import Lesson, LessonCompletion, Exercise, ExerciseSubmission

            lessons = []
            next_lesson_id = None
            completed_ids = []

            # Compute completed lesson ids for the current student (if requested)
            if include_progress and request.user.is_authenticated:
                completed_qs = LessonCompletion.objects.filter(
                    student=request.user, lesson__course_id=course_id
                )
                completed_set = set(completed_qs.values_list("lesson_id", flat=True))
            else:
                completed_set = set()

            # Determine the highest order completed so we can unlock the next lesson
            lessons_qs = Lesson.objects.filter(course_id=course_id).order_by("order")
            last_completed_order = 0
            if completed_set:
                last_completed_order = (
                    Lesson.objects.filter(id__in=completed_set).aggregate(models.Max("order"))["order__max"]
                    or 0
                )

            for lesson in lessons_qs:
                lid = lesson.id
                is_completed = lid in completed_set
                if is_completed:
                    completed_ids.append(lid)
                if next_lesson_id is None and not is_completed:
                    next_lesson_id = lid

                # free preview flag not implemented in model; default False
                is_free_preview = False

                # sequential unlock: lessons with order <= last_completed_order + 1 are unlocked
                sequential_unlocked = lesson.order <= (last_completed_order + 1)

                locked_reason = None
                if not enrolled and not is_free_preview:
                    locked_reason = "not_enrolled"
                elif not sequential_unlocked:
                    locked_reason = "locked_sequential"

                # provide basic exercise info (first exercise) and whether it's unlocked for the student
                first_ex = lesson.exercises.first()
                exercise_payload = None
                if first_ex:
                    # check if the student has a passing submission for this exercise
                    passed = False
                    if request.user.is_authenticated:
                        sub = (
                            ExerciseSubmission.objects.filter(exercise=first_ex, student=request.user)
                            .order_by("-created_at")
                            .first()
                        )
                        if sub:
                            passed = bool(sub.passed or sub.is_approved)

                    # exercise unlocked only when the lesson itself is completed
                    exercise_unlocked = is_completed
                    exercise_payload = {
                        "id": first_ex.id,
                        "title": first_ex.title,
                        "description": first_ex.description,
                        "time_estimate": first_ex.time_estimate,
                        "unlocked": exercise_unlocked,
                        "completed": passed,
                    }

                lessons.append(
                    {
                        "id": lid,
                        "title": lesson.title,
                        "section_id": None,
                        "position": lesson.order,
                        "duration_sec": (lesson.duration * 60) if lesson.duration is not None else None,
                        "content_type": lesson.lesson_type,
                        "is_free_preview": is_free_preview,
                        "lock_reason": locked_reason,
                        "exercise": exercise_payload,
                    }
                )

            progress = {
                "completed_lesson_ids": completed_ids,
                "percent": details.get("progress") if isinstance(details.get("progress"), int) else 0,
                "next_lesson_id": next_lesson_id,
            }

            payload = {
                "course": {
                    "id": details.get("id"),
                    "title": details.get("title"),
                    "slug": None,
                    "cover": details.get("cover_image"),
                    "teacher": details.get("creator"),
                    "enrollment_status": enrollment_status,
                },
                "sections": [],  # no sections model yet; FE will render lessons grouped if needed
                "lessons": lessons,
                "progress": progress,
            }

            return Response(payload)
        except CourseNotFoundError:
            return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
        except TeoArtServiceException as e:
            logger.warning(f"Service error in CourseOutlineAPIView: {e}")
            return Response({"error": str(e)}, status=(e.status_code if hasattr(e, "status_code") else status.HTTP_400_BAD_REQUEST))
        except Exception as e:
            logger.error(f"Unexpected error in CourseOutlineAPIView: {e}")
            return Response({"error": "An error occurred while retrieving course outline"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TeacherCoursesView(generics.ListAPIView):
    """
    List courses owned by the authenticated teacher.
    This endpoint is used by the Studio frontend to show the teacher's courses.
    """
    serializer_class = None  # set dynamically to avoid circular imports at module load
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_serializer_class(self):
        # Import here to avoid import cycles
        from courses.serializers import TeacherCourseSerializer

        return TeacherCourseSerializer

    def get_queryset(self):
        user = self.request.user
        # Return all courses where the user is the teacher (include unapproved so teacher can edit drafts)
        # Optimize: select_related teacher, prefetch only necessary lesson fields in order
        from django.db.models import Prefetch
        from courses.models import Lesson

        lessons_qs = (
            Lesson.objects.all()
            .only("id", "title", "order", "duration", "lesson_type", "created_at")
            .order_by("order", "created_at")
        )

        qs = (
            Course.objects.filter(teacher=user)
            .select_related("teacher")
            .prefetch_related(Prefetch("lessons", queryset=lessons_qs))
            .only("id", "title", "description", "price_eur", "cover_image", "is_approved", "created_at", "updated_at", "category", "teacher")
            .order_by("-created_at")
        )
        return qs
