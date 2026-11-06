{ lib
, stdenvNoCC
, fetchFromGitHub
, nodejs_24
}:

stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "expo-icons-papyrus";
  version = "0.1.0";

  src = lib.fileset.toSource {
    root = ../../..;
    fileset = lib.fileset.unions [
      ../../../package.json
      ../../../README.md
      ../../../icons.json
      ../../../scripts
      ../../../src
    ];
  };

  papirus = fetchFromGitHub {
    owner = "PapirusDevelopmentTeam";
    repo = "papirus-icon-theme";
    rev = "bf539287ef5dc18529424a02cccee76175920a6f";
    hash = "sha256-X1iD/1cPRU0lOkMu8nyUaGJTWOzyOiB6i+nlAYRF66I=";
  };

  nativeBuildInputs = [ nodejs_24 ];

  dontConfigure = true;
  dontBuild = true;

  # The whole package is source: Metro and Vite transpile the TypeScript
  # themselves, so there is nothing to compile ahead of them.
  installPhase = ''
    runHook preInstall

    mkdir -p $out
    cp package.json README.md icons.json $out/
    cp -r src $out/
    node scripts/generate.mjs ${finalAttrs.papirus}/Papirus $out/src/icons

    runHook postInstall
  '';

  meta = {
    description = "Papirus icons as react-native-svg components, one module per icon";
    homepage = "https://github.com/PapirusDevelopmentTeam/papirus-icon-theme";
    license = lib.licenses.gpl3Only;
    platforms = lib.platforms.all;
  };
})
