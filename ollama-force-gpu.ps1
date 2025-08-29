#Requires -RunAsAdministrator

# RTX 5090 32GB Optimized Ollama Script
Write-Host "=== Ollama RTX 5090 32GB Optimizer ===" -ForegroundColor Green

# Function to check if Ollama is running
function Test-OllamaRunning {
    $processes = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
    return $processes.Count -gt 0
}

# Function to force stop Ollama
function Stop-OllamaForce {
    Write-Host "Stopping all Ollama processes..." -ForegroundColor Yellow
    Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    # Also stop any ollama serve processes
    Get-Process | Where-Object { $_.ProcessName -eq "ollama" -or $_.CommandLine -like "*ollama*serve*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# Check if Ollama is already running
if (Test-OllamaRunning) {
    Stop-OllamaForce
}

Write-Host "Setting RTX 5090 32GB optimized environment..." -ForegroundColor Green

# Clear any existing Ollama environment variables
$ollamaVars = @(
    "OLLAMA_HOST", "OLLAMA_GPU_OVERHEAD", "OLLAMA_MAX_LOADED_MODELS", 
    "OLLAMA_NUM_PARALLEL", "OLLAMA_CONTEXT_LENGTH", "OLLAMA_KEEP_ALIVE",
    "OLLAMA_FLASH_ATTENTION", "OLLAMA_KV_CACHE_TYPE", "OLLAMA_MAX_QUEUE",
    "OLLAMA_DEBUG", "CUDA_VISIBLE_DEVICES", "OLLAMA_SCHED_SPREAD"
)

foreach ($var in $ollamaVars) {
    Remove-Item "Env:$var" -ErrorAction SilentlyContinue
}

# RTX 5090 32GB Optimized Settings
$env:OLLAMA_HOST = "0.0.0.0:11434"                 # WSL accessible
$env:OLLAMA_DEBUG = "INFO"                         # Debug logging
$env:OLLAMA_GPU_OVERHEAD = "2048"                  # 2GB overhead for 32GB GPU
$env:OLLAMA_MAX_LOADED_MODELS = "4"                # Multiple large models
$env:OLLAMA_NUM_PARALLEL = "4"                     # Parallel requests
$env:OLLAMA_CONTEXT_LENGTH = "16384"               # Large context for RTX 5090
$env:OLLAMA_KEEP_ALIVE = "30m"                     # Keep models loaded longer
$env:OLLAMA_FLASH_ATTENTION = "true"               # Enable flash attention
$env:OLLAMA_KV_CACHE_TYPE = "f16"                  # Faster cache
$env:OLLAMA_MAX_QUEUE = "1024"                     # Large request queue
$env:OLLAMA_SCHED_SPREAD = "false"                 # Use single GPU
$env:CUDA_VISIBLE_DEVICES = "0"                    # Force GPU 0

# Display settings
Write-Host "`nApplied RTX 5090 Optimizations:" -ForegroundColor Cyan
Write-Host "  OLLAMA_HOST: $env:OLLAMA_HOST" -ForegroundColor White
Write-Host "  GPU_OVERHEAD: $env:OLLAMA_GPU_OVERHEAD MB" -ForegroundColor White
Write-Host "  MAX_MODELS: $env:OLLAMA_MAX_LOADED_MODELS" -ForegroundColor White
Write-Host "  PARALLEL: $env:OLLAMA_NUM_PARALLEL" -ForegroundColor White
Write-Host "  CONTEXT: $env:OLLAMA_CONTEXT_LENGTH" -ForegroundColor White
Write-Host "  KEEP_ALIVE: $env:OLLAMA_KEEP_ALIVE" -ForegroundColor White
Write-Host "  FLASH_ATTENTION: $env:OLLAMA_FLASH_ATTENTION" -ForegroundColor White

Write-Host "`nStarting Ollama with RTX 5090 optimizations..." -ForegroundColor Green

try {
    # Start Ollama serve with explicit environment
    $process = Start-Process -FilePath "ollama" -ArgumentList "serve" -PassThru -NoNewWindow
    
    if ($process) {
        Write-Host "Ollama process started (PID: $($process.Id))" -ForegroundColor Green
        
        # Wait for startup
        Write-Host "Waiting for Ollama to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 8
        
        # Test connection
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 15
            Write-Host "✅ Ollama started successfully and is responding!" -ForegroundColor Green
            
            # Show GPU detection in logs
            Write-Host "`nChecking for RTX 5090 detection..." -ForegroundColor Cyan
            Start-Sleep -Seconds 2
            
            Write-Host "`n🎯 SUCCESS: RTX 5090 32GB Optimization Complete!" -ForegroundColor Green
            Write-Host "📍 Ollama accessible at: http://0.0.0.0:11434" -ForegroundColor Yellow
            Write-Host "🌐 From WSL, use Windows IP:11434" -ForegroundColor Yellow
            Write-Host "🚀 Ready for AgentHive AI integration!" -ForegroundColor Magenta
            
        } catch {
            Write-Warning "Ollama started but connection test failed: $_"
            Write-Host "Check the logs above for GPU detection" -ForegroundColor Yellow
        }
    } else {
        throw "Failed to start Ollama process"
    }
    
} catch {
    Write-Error "Failed to start Ollama: $_"
    exit 1
}

Write-Host "`nPress Ctrl+C to stop Ollama, or close this window" -ForegroundColor Gray
Write-Host "Environment active for this PowerShell session" -ForegroundColor Gray

# Keep PowerShell running and show live logs
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nCleaning up..." -ForegroundColor Yellow
    Stop-OllamaForce
}