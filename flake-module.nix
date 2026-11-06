{ inputs, ... }:
{
  perSystem =
    { system, ... }:
    let
      # nixpkgs-unstable, like plaat-fm: the icons end up inside its pnpm store.
      pkgs = inputs.nixpkgs-unstable.legacyPackages.${system};
    in
    {
      packages.expo-icons-papyrus = pkgs.callPackage ./nix/package/expo-icons-papyrus { };

      devenv.shells.expo-icons-papyrus = {
        name = "expo-icons-papyrus";
        imports = [ ./devenv.nix ];
        packages = [ pkgs.nodejs_24 pkgs.pnpm ];
      };
    };
}
