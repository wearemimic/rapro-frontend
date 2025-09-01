"""
URL configuration for retirementadvisorpro project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# from core.views import login_view
from core.views_main import home_view
# from core.views import AdvisorClientListView

urlpatterns = [
    path('', home_view),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),  # <-- this is what makes /api/login/ work
    path('api/client-portal/', include('core.client_portal_urls')),  # Client portal API endpoints
    # path('api/', include('report_center.urls')),  # Report Center API endpoints - TEMPORARILY DISABLED for debugging
    # path("api/clients/", AdvisorClientListView.as_view(), name="advisor-clients"),
   
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)