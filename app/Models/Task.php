<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'progress',
        'is_favourite',
        'category',
        'priority',
        'due_date',
        'is_completed',
    ];

    protected $casts = [
        'is_favourite' => 'boolean',
        'is_completed' => 'boolean',
        'progress' => 'integer',
        'due_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
