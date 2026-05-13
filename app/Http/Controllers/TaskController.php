<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->tasks();

        // Filter by favourite
        if ($request->has('favourite') && $request->favourite) {
            $query->where('is_favourite', true);
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Filter by completion status
        if ($request->has('completed')) {
            $query->where('is_completed', (bool) $request->completed);
        }

        // Search by title
        if ($request->has('search') && $request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'tasks' => $tasks,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'progress' => 'integer|min:0|max:100',
            'category' => 'string|max:100',
            'priority' => 'string|in:low,medium,high',
            'due_date' => 'nullable|date',
        ]);

        $task = $request->user()->tasks()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully!',
            'task' => $task,
        ], 201);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);

        return response()->json([
            'success' => true,
            'task' => $task,
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'progress' => 'sometimes|integer|min:0|max:100',
            'is_favourite' => 'sometimes|boolean',
            'category' => 'sometimes|string|max:100',
            'priority' => 'sometimes|string|in:low,medium,high',
            'due_date' => 'nullable|date',
            'is_completed' => 'sometimes|boolean',
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully!',
            'task' => $task->fresh(),
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully!',
        ]);
    }

    public function toggleFavourite(Request $request, $id): JsonResponse
    {
        $task = $request->user()->tasks()->findOrFail($id);
        $task->update(['is_favourite' => !$task->is_favourite]);

        return response()->json([
            'success' => true,
            'message' => $task->is_favourite ? 'Added to favourites!' : 'Removed from favourites.',
            'task' => $task->fresh(),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $tasks = $user->tasks;

        $total = $tasks->count();
        $completed = $tasks->where('is_completed', true)->count();
        $inProgress = $tasks->where('is_completed', false)->count();
        $favourites = $tasks->where('is_favourite', true)->count();
        $avgProgress = $total > 0 ? round($tasks->avg('progress')) : 0;

        // Category breakdown
        $categories = $tasks->groupBy('category')->map(fn($g) => $g->count())->toArray();

        // Priority breakdown
        $priorities = $tasks->groupBy('priority')->map(fn($g) => $g->count())->toArray();

        // Overdue tasks
        $overdue = $tasks->where('is_completed', false)
            ->filter(fn($t) => $t->due_date && \Carbon\Carbon::parse($t->due_date)->isPast())
            ->count();

        // Tasks due this week
        $dueThisWeek = $tasks->where('is_completed', false)
            ->filter(fn($t) => $t->due_date && \Carbon\Carbon::parse($t->due_date)->isBetween(now()->startOfDay(), now()->endOfWeek()))
            ->count();

        // Weekly activity (tasks created/completed per day for last 7 days)
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $dayLabel = now()->subDays($i)->format('D');
            $created = $tasks->filter(fn($t) => $t->created_at->toDateString() === $date)->count();
            $done = $tasks->filter(fn($t) => $t->is_completed && $t->updated_at->toDateString() === $date)->count();
            $weeklyActivity[] = ['day' => $dayLabel, 'date' => $date, 'created' => $created, 'completed' => $done];
        }

        // Productivity score (0-100)
        $productivityScore = 0;
        if ($total > 0) {
            $completionRate = ($completed / $total) * 40;
            $progressRate = ($avgProgress / 100) * 30;
            $overdueRate = $overdue > 0 ? max(0, 30 - ($overdue / $total) * 30) : 30;
            $productivityScore = round($completionRate + $progressRate + $overdueRate);
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'total' => $total,
                'completed' => $completed,
                'in_progress' => $inProgress,
                'favourites' => $favourites,
                'average_progress' => $avgProgress,
                'overdue' => $overdue,
                'due_this_week' => $dueThisWeek,
                'categories' => $categories,
                'priorities' => $priorities,
                'weekly_activity' => $weeklyActivity,
                'productivity_score' => $productivityScore,
                'completion_rate' => $total > 0 ? round(($completed / $total) * 100) : 0,
            ],
        ]);
    }
}
