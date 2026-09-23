<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ProjectController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);
Route::apiResource('projects', ProjectController::class);
