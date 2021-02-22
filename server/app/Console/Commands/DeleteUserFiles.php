<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DeleteUserFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'userFiles:delete';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete zip foldr after 7 days';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function delete()
    {
        collect(Storage::disk('public')->listContents('uploads', true))->each(function ($file) {
            if ($file['type'] == 'file' && $file['timestamp'] < now()->subDays(7)->getTimestamp()) {
                Storage::disk('public')->delete($file['path']);
            }
        });
    }
}
