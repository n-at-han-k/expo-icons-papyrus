{
  inputs.nixpkgs-unstable.url = "github:NixOS/nixpkgs/a391f95d4557d685fd8e5dc0d4b1f9271aa2f342";

  outputs = inputs@{ nixpkgs-unstable, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    {
      packages = nixpkgs-unstable.lib.genAttrs systems (
        system:
        let
          expo-icons-papyrus =
            nixpkgs-unstable.legacyPackages.${system}.callPackage ./nix/package/expo-icons-papyrus { };
        in
        {
          inherit expo-icons-papyrus;
          default = expo-icons-papyrus;
        }
      );
    };
}
