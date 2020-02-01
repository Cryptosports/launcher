!macro customInstall
	; https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads

	ReadRegStr $1 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X64" "Installed"
	StrCmp $1 1 installed ; jump to installed

	ExecWait "${BUILD_RESOURCES_DIR}\VC_redist.x64.exe /quiet"

	installed:

!macroend