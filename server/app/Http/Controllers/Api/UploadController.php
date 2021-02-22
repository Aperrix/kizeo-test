<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\JWTService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Lcobucci\JWT\Signer\Key\InMemory;
use ZipArchive;

class UploadController extends Controller
{
    /**
     * Provision a new web server.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function __invoke(JWTService $JWT)
    {
        request()->validate([
            'files' => 'required|max:2048',
            'recipients' => 'required',
            'sender' => 'required',
        ]);

        $files = request()->file('files');

        $fileList = [];

        $uuid = Str::uuid();

        $invalidFiles = array_filter($files, function ($file) {
            return !$file->isValid();
        });

        if (count($invalidFiles) > 0) {
            return response()->json([
                "message" => count($invalidFiles).(count($invalidFiles) > 1 ? ' files are' : ' file is').' invalid',
                "files" => array_map(function ($file) {
                    return $file->getClientOriginalName();
                }, $invalidFiles)
            ]);
        }

        $zipFileName = $uuid.'.zip';

        $zip = new ZipArchive;

        if ($zip->open(storage_path('app/public/uploads/'.$zipFileName), ZipArchive::CREATE) === true) {
            foreach ($files as $file) {
                $fileName = $file->getClientOriginalName();
                $fileList[] = $fileName;
                $filePath = $file->storeAs('uploadedFiles/'.$uuid, $fileName, 'local');
                $zip->addFile(storage_path('app/'.$filePath), $fileName);
            }
        }
        
        $zip->close();

        File::deleteDirectory(storage_path('app/uploadedFiles'));

        $token = $JWT->generate($uuid)->toString();

        $tokenedUrl = route('download', ['uuid' => $uuid, 'token' => $token]);

        // $signedUrl = URL::temporarySignedRoute(
        //     'download',
        //     now()->addDays(7),
        //     ['uuid' => $uuid]
        // );

        return response()->json([
                "message" => "Files successfully uploaded",
                "url" => $tokenedUrl
            ]);
    }
}
