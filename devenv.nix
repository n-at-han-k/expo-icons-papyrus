{
  # nodejs comes from the flake module: it has to be the nixpkgs-unstable one
  # whose pnpm matches package.json's packageManager.
  enterShell = ''
    if [ ! -d node_modules ]; then
      echo "node_modules not found — running 'pnpm install'..."
      pnpm install
    fi
  '';
}
