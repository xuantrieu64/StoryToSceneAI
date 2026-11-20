<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CreditWalletResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'balance_available' => (int) $this->balance_available,
            'balance_held' => (int) $this->balance_held,
            'total_balance' => (int) ($this->balance_available + $this->balance_held),
            'updated_at' => $this->updated_at,
        ];
    }
}
