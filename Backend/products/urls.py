from django.urls import path
from . import views

urlpatterns = [
    path('', views.index)# the first arg is a string that specifys our url endpoints 
]
   