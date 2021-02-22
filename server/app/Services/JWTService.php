<?php

namespace App\Services;

use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\UnencryptedToken;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Validation\Constraint;
use Lcobucci\JWT\Validation\ConstraintViolation;

class JWTService
{
    private Configuration $config;

    public function __construct()
    {
        $this->config = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::base64Encoded(env('JWT_SECRET'))
        );
    }
    
    public function generate($uuid)
    {
        $now = new \DateTimeImmutable();


        return $this->config->builder()
                ->identifiedBy($uuid)
                ->issuedAt($now)
                ->canOnlyBeUsedAfter($now->modify('+1 minute'))
                ->expiresAt($now->modify('+7 days'))
                ->getToken($this->config->signer(), $this->config->signingKey());
    }

    public function validate($token, $uuid)
    {
        $now = new \DateTimeImmutable();

        $decodedToken = $this->config->parser()->parse($token);

        if (!$decodedToken instanceof UnencryptedToken) {
            throw new ConstraintViolation('Token invalide');
        }

        if ($decodedToken->claims()->get('jti') !== $uuid) {
            throw new ConstraintViolation('Accès interdit');
        }

        if ($decodedToken->claims()->get('exp') < $now) {
            throw new ConstraintViolation('Token expiré');
        }

        return true;
    }
}
