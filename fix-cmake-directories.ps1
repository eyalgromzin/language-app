# Script to create missing CMake directories and files for React Native packages

$packages = @(
    "@dr.pogodin/react-native-fs",
    "@react-native-async-storage/async-storage", 
    "@react-native-documents/picker",
    "@react-native-google-signin/google-signin",
    "react-native-gesture-handler",
    "react-native-sound",
    "react-native-vector-icons",
    "react-native-webview"
)

foreach ($package in $packages) {
    $jniPath = "node_modules\$package\android\build\generated\source\codegen\jni"
    $cmakePath = "$jniPath\CMakeLists.txt"
    
    Write-Host "Creating directory: $jniPath"
    New-Item -ItemType Directory -Force -Path $jniPath | Out-Null
    
    Write-Host "Creating CMakeLists.txt: $cmakePath"
    $cmakeContent = "# Auto-generated CMakeLists.txt for $package`ncmake_minimum_required(VERSION 3.13)`nset(CMAKE_VERBOSE_MAKEFILE on)`nset(CMAKE_OBJECT_PATH_MAX 1000)`n`n# This is a placeholder CMakeLists.txt for packages that don't have native C++ code`n# but are referenced by the autolinking system"
    
    Set-Content -Path $cmakePath -Value $cmakeContent
    Write-Host "✓ Created $cmakePath"
}

Write-Host "All missing CMake directories and files have been created!"
