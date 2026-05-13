<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// SPA entry point — serves the single Blade view for all frontend routes
Route::get('/', function () {
    return view('welcome');
});

// CSRF token refresh endpoint
Route::get('/api/csrf', function () {
    return response()->json(['token' => csrf_token()]);
});

// Authentication routes
Route::post('/api/register', [AuthController::class, 'register']);
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/logout', [AuthController::class, 'logout'])->middleware('auth');
Route::get('/api/user', [AuthController::class, 'user']);

// Task routes (authenticated)
Route::middleware('auth')->group(function () {
    Route::get('/api/tasks', [TaskController::class, 'index']);
    Route::post('/api/tasks', [TaskController::class, 'store']);
    Route::get('/api/tasks/stats', [TaskController::class, 'stats']);
    Route::get('/api/tasks/{id}', [TaskController::class, 'show']);
    Route::put('/api/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/api/tasks/{id}', [TaskController::class, 'destroy']);
    Route::post('/api/tasks/{id}/favourite', [TaskController::class, 'toggleFavourite']);
});
