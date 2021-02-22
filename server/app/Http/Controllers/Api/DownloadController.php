<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\JWTService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DownloadController extends Controller
{
    public function __invoke($uuid, $token, JWTService $JWT)
    {
        $validToken = $JWT->validate($token, $uuid);

        if ($validToken === false) {
            return response()->json([
                "message" => 'Access denied'
            ]);
        }

        return response()->download(public_path('storage/uploads/'.$uuid.'.zip'));
    }
}
