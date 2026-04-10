from django.contrib import admin
from .models import Workspace, Project, Task, Comment

admin.site.register(Workspace)
admin.site.register(Project)
admin.site.register(Task)
admin.site.register(Comment)
