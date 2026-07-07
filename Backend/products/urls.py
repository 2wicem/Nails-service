from django.urls import path

from . import admin_views, auth_views, contact_views, slot_views, views, worker_views

urlpatterns = [
    path('', views.index),
    path('contact/', contact_views.create_contact_message, name='create_contact_message'),
    path('contact/info/', contact_views.get_contact_info, name='get_contact_info'),
    path('bookings/', views.create_booking, name='create_booking'),
    path('bookings/mine/', views.my_bookings, name='my_bookings'),
    path('bookings/list/', views.list_bookings, name='list_bookings'),
    path('bookings/worker/', worker_views.worker_bookings, name='worker_bookings'),
    path('workers/', worker_views.list_public_workers, name='list_public_workers'),
    path('bookings/<int:booking_id>/accept/', worker_views.accept_booking, name='accept_booking'),
    path('bookings/<int:booking_id>/cancel/', worker_views.cancel_booking_worker, name='cancel_booking_worker'),
    path('slots/', slot_views.list_available_slots, name='list_available_slots'),
    path('slots/manage/', slot_views.manage_slots, name='manage_slots'),
    path('slots/toggle/', slot_views.toggle_slot, name='toggle_slot'),
    path('slots/off-day/', worker_views.off_day, name='off_day'),
    path('auth/register/', auth_views.register, name='register'),
    path('auth/login/', auth_views.login_view, name='login'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/me/', auth_views.me, name='me'),
    path('admin/stats/', admin_views.stats, name='admin_stats'),
    path('admin/messages/', admin_views.list_contact_messages, name='admin_list_messages'),
    path('admin/contact-info/', admin_views.get_salon_contact_info, name='admin_get_contact_info'),
    path('admin/contact-info/update/', admin_views.update_salon_contact_info, name='admin_update_contact_info'),
    path('admin/users/', admin_views.list_users, name='admin_list_users'),
    path('admin/users/<int:user_id>/role/', admin_views.update_user_role, name='admin_update_role'),
    path('admin/bookings/<int:booking_id>/', admin_views.delete_booking, name='admin_delete_booking'),
]
   