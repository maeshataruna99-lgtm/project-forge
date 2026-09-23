<?php

namespace App\Http\Controllers\Api;

use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProjectController
{
    public function index(): JsonResponse
    {
        return response()->json(Project::query()->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['name' => ['required', 'string', 'max:120']]);

        return response()->json(Project::query()->create($validated), Response::HTTP_CREATED);
    }

    public function show(Project $project): JsonResponse
    {
        return response()->json($project);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate(['name' => ['sometimes', 'required', 'string', 'max:120']]);
        $project->fill($validated)->save();

        return response()->json($project->refresh());
    }

    public function destroy(Project $project): Response
    {
        $project->delete();

        return response()->noContent();
    }
}
