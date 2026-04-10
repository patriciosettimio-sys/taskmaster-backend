from rest_framework import serializers
from .models import Workspace, Project, Task, Comment

class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.email')

    class Meta:
        model = Comment
        fields = '__all__'
        read_only_fields = ('author',)

class TaskSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    assignee_email = serializers.ReadOnlyField(source='assignee.email')

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('creator',)
