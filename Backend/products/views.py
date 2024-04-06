from django.http import HttpResponse
from django.shortcuts import render
 # create another file url.py
 # the url tells django that whenever theres a request to /products call the function endex
def index(request):
    return HttpResponse('Hello World');
