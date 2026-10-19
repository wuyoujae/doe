use std::sync::Arc;
use yrkie_backend::{assets, config::Config, doe, generation, http, models::Repository, projects};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::from_env()?;
    // Acquire process ownership before migrations or interrupted-run recovery.
    let listener = tokio::net::TcpListener::bind(config.listen).await?;
    std::fs::create_dir_all(&config.data_dir)?;
    let instance_lock = std::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(config.data_dir.join("server.lock"))?;
    instance_lock.try_lock().map_err(
        |_| "Another backend owns this data directory; stop it before starting a replacement",
    )?;
    let repository = Arc::new(Repository::open(&config.data_dir)?);
    let doe_repository = Arc::new(doe::Repository::open(&config.data_dir)?);
    let projects = Arc::new(projects::Repository::open(&config.data_dir)?);
    let assets = Arc::new(assets::Repository::open(&config.data_dir)?);
    let attachments = Arc::new(yrkie_backend::attachments::Repository::open(
        &config.data_dir,
    )?);
    let exports = yrkie_backend::exports::Service::open(&config.data_dir, assets.clone())?;
    exports.start();
    let playback = Arc::new(yrkie_backend::playback::Service::open(&config.data_dir)?);
    projects.recover_interrupted()?;
    for id in attachments.recover_interrupted()? {
        attachments.spawn(&id);
    }
    let runner = Arc::new(generation::Runner::new(
        projects.clone(),
        repository.clone(),
        doe_repository.clone(),
        assets.clone(),
    ));
    println!("Yrkie local backend listening on http://{}", config.listen);
    axum::serve(
        listener,
        http::router(
            repository,
            doe_repository,
            projects,
            assets,
            runner,
            attachments,
            exports,
            playback,
            config.allowed_origins,
            config.allowed_hosts,
        ),
    )
    .with_graceful_shutdown(async {
        let _ = tokio::signal::ctrl_c().await;
    })
    .await?;
    Ok(())
}
