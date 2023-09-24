FROM ipfs/kubo:latest
RUN ipfs init
RUN ipfs config --json Experimental.Libp2pStreamMounting true
RUN ipfs config --json Experimental.P2pHttpProxy true
# Execute the daemon subcommand by default
CMD ["daemon", "--migrate=true", "--agent-version-suffix=docker"]