# core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CustomUser
from .models import Client

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone_number',
            'company_name', 'website_url', 'address', 'city', 'state',
            'zip_code', 'white_label_company_name', 'white_label_support_email',
            'primary_color', 'logo'
        ]
        read_only_fields = ['id', 'email']  # Optional: disable email edit

class UserSerializer(serializers.ModelSerializer):
    profile = CustomUserSerializer()
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance
    
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'first_name', 'last_name', 'email', 'birthdate', 'tax_status', 'status']