import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

# Avoid printing secrets to stdout in production. Use conditional debug logging.
if os.getenv("ENVIRONMENT", "development") != "production":
    try:
        import logging

        logging.getLogger(__name__).debug("BASE_DIR: %s", BASE_DIR)
        logging.getLogger(__name__).debug(
            "Loaded STRIPE_SECRET_KEY: %s", os.getenv("STRIPE_SECRET_KEY")
        )
    except Exception:
        # best-effort logging; do not raise during settings import
        pass

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "drf_yasg",
    "modelcluster",
    "taggit",
    "authentication",
    "core.apps.CoreConfig",
    "users",
    "courses",
    "rewards",
    "notifications",
    "blockchain",
    "services.apps.ServicesConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # 'core.middleware.AutoJWTFromSessionMiddleware',  # RIMOSSO: causava problemi con logout e duplicava funzionalità JWT
    "core.middleware.APITimingMiddleware",
    "core.middleware.GlobalErrorHandlingMiddleware",
]

SESSION_COOKIE_DOMAIN = None
CSRF_COOKIE_DOMAIN = None

# Use the project package name (when running from the `backend` folder
# the package is importable as `schoolplatform`, not `backend.schoolplatform`)
ROOT_URLCONF = "schoolplatform.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "schoolplatform.wsgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

SIMPLE_JWT = {
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "TOKEN_OBTAIN_SERIALIZER": "authentication.serializers.CustomTokenObtainPairSerializer",
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/min",
        "user": "1000/min",
        "wallet_challenge": "5/min",
        "wallet_link": "10/min",
    },
}

AUTH_USER_MODEL = "users.User"

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_COOKIE_AGE = 3600
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

LOGIN_REDIRECT_URL = "/app/dashboard/default"
LOGOUT_REDIRECT_URL = "/login/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
TEST_RUNNER = "django.test.runner.DiscoverRunner"

# CORS / CSRF for local frontend dev
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# Blockchain config (comune)
POLYGON_AMOY_RPC_URL = os.getenv(
    "POLYGON_AMOY_RPC_URL", "https://rpc-amoy.polygon.technology/"
)
TEOCOIN_CONTRACT_ADDRESS = os.getenv(
    "TEOCOIN_CONTRACT_ADDRESS", "0x20D6656A31297ab3b8A87291Ed562D4228Be9ff8"
)
ADMIN_PRIVATE_KEY = os.getenv("ADMIN_PRIVATE_KEY")
ADMIN_WALLET_ADDRESS = os.getenv("ADMIN_WALLET_ADDRESS")

# Platform wallet address for TeoCoin payments (with minting permissions)
PLATFORM_WALLET_ADDRESS = os.getenv(
    "PLATFORM_WALLET_ADDRESS", "0x3b72a4E942CF1467134510cA3952F01b63005044"
)
PLATFORM_PRIVATE_KEY = os.getenv("PLATFORM_PRIVATE_KEY")

# Reward Pool Configuration
REWARD_POOL_ADDRESS = os.getenv(
    "REWARD_POOL_ADDRESS", "0x17051AB7603B0F7263BC86bF1b0ce137EFfdEcc1"
)
REWARD_POOL_PRIVATE_KEY = os.getenv(
    "REWARD_POOL_PRIVATE_KEY", os.getenv("ADMIN_PRIVATE_KEY")
)

# Payment configuration
TEOCOIN_EUR_RATE = 10  # 1 EUR = 10 TEO (base rate before discounts)
TEOCOIN_POOL_PERCENTAGE = 10  # 10% of fiat revenue goes to TeoCoin reward pool

# File upload
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 250 * 1024 * 1024  # 250MB
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755
FILE_UPLOAD_TEMP_DIR = None

# Default from email
DEFAULT_FROM_EMAIL = "no-reply@teocoin.io"

# Stripe config (comune, ma chiave segreta obbligatoria solo in prod)
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

# Backend di autenticazione standard per admin Django
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

# TeoCoin System Configuration
USE_DB_TEOCOIN_SYSTEM = os.getenv("USE_DB_TEOCOIN_SYSTEM", "True").lower() == "true"
# 'database' or 'blockchain'
TEOCOIN_SYSTEM = os.getenv("TEOCOIN_SYSTEM", "database")

# Reward System Configuration
REWARD_SYSTEM_BACKEND = "services.db_teocoin_service.DBTeoCoinService"
