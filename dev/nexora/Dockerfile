# Package only offline-built Linux ARM64 executables from an external context.
# No build frontend directive, base-image download, shell or package installation.
FROM scratch AS app
LABEL com.docker.compose.project="nexora" org.opencontainers.image.title="NEXORA isolated development skeleton"
COPY --chown=65532:65532 nexora /nexora
USER 65532:65532
STOPSIGNAL SIGTERM
ENTRYPOINT ["/nexora"]

FROM scratch AS runtime-demo
LABEL com.docker.compose.project="nexora" org.opencontainers.image.title="NEXORA fixed-fixture development demo"
COPY --chown=65532:65532 runtime-demo /runtime-demo
USER 65532:65532
ENTRYPOINT ["/runtime-demo"]
