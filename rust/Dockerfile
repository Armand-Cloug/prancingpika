############################
# 1) builder
############################
FROM rust:1.82-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache les dépendances en compilant des stubs vides.
# Cette couche ne se rebuild que si Cargo.toml ou Cargo.lock changent.
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src && \
    echo 'pub fn _placeholder() {}' > src/lib.rs && \
    echo 'fn main() {}'            > src/main.rs && \
    cargo build --release --bin pika-parser && \
    rm -rf src

# Copie les sources réelles et recompile uniquement l'application
COPY src ./src
RUN touch src/lib.rs src/main.rs && \
    cargo build --release --bin pika-parser

############################
# 2) runtime
############################
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/pika-parser ./pika-parser

RUN useradd -r -u 10001 -s /bin/false parser
USER parser

EXPOSE 8080

CMD ["./pika-parser", "serve", "--port", "8080"]
