# ---------- BASE ----------
FROM php:8.4-fpm-alpine AS base

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions \
 && install-php-extensions pdo_mysql redis opcache bcmath pcntl zip intl gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html

# ---------- DEV ----------
FROM base AS dev
RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

# ---------- VENDOR (cache lớp composer) ----------
FROM base AS vendor
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# ---------- PROD ----------
FROM base AS prod
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
 && printf "opcache.validate_timestamps=0\nopcache.memory_consumption=192\n" > "$PHP_INI_DIR/conf.d/opcache-prod.ini"

COPY --from=vendor /var/www/html/vendor ./vendor
COPY . .
RUN composer dump-autoload --optimize --no-dev \
 && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache

USER www-data