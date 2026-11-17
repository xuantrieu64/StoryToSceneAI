<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'db'     => DB::connection()->getPdo() ? 'connected' : 'failed',
        'redis'  => Cache::store('redis')->put('health', 1, 10) ? 'connected' : 'failed',
    ]);
});