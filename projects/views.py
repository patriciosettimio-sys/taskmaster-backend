from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Workspace, Project, Task, Comment
from .serializers import WorkspaceSerializer, ProjectSerializer, TaskSerializer, CommentSerializer

class WorkspaceViewSet(viewsets.ModelViewSet):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer

    def get_queryset(self):
        # Users can only see workspaces they are members of
        return self.queryset.filter(members=self.request.user)

    def perform_create(self, serializer):
        workspace = serializer.save()
        workspace.members.add(self.request.user)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return self.queryset.filter(workspace__members=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'project']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority']

    def get_queryset(self):
        return self.queryset.filter(project__workspace__members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def get_queryset(self):
        return self.queryset.filter(task__project__workspace__members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
