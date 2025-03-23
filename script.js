document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const convertButton = document.getElementById('convertButton');
    const resetButton = document.getElementById('resetButton');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultContainer = document.getElementById('resultContainer');
    const resultFileName = document.getElementById('resultFileName');
    const resultFileSize = document.getElementById('resultFileSize');
    const resultAudioInfo = document.getElementById('resultAudioInfo');
    const audioPreview = document.getElementById('audioPreview');
    const downloadButton = document.getElementById('downloadButton');
    const dynamicRange = document.getElementById('dynamicRange');
    const dynamicRangeValue = document.getElementById('dynamicRangeValue');

    // 设置滑块值显示
    dynamicRange.addEventListener('input', function() {
        dynamicRangeValue.textContent = this.value + '%';
    });

    // 拖放功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('active');
    }

    function unhighlight() {
        dropArea.classList.remove('active');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // 文件选择处理
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    let selectedFile = null;

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            if (selectedFile.type.includes('audio/mpeg') || selectedFile.name.endsWith('.mp3')) {
                fileName.textContent = selectedFile.name;
                convertButton.disabled = false;
            } else {
                alert('请选择 MP3 文件');
                resetForm();
            }
        }
    }

    // 重置功能
    resetButton.addEventListener('click', resetForm);

    function resetForm() {
        selectedFile = null;
        fileName.textContent = '';
        fileInput.value = '';
        convertButton.disabled = true;
        progressContainer.style.display = 'none';
        resultContainer.style.display = 'none';
        
        // 重置所有设置
        document.querySelector('input[name="sampleRate"][value="44100"]').checked = true;
        document.querySelector('input[name="bitDepth"][value="16"]').checked = true;
        document.querySelector('input[name="channels"][value="2"]').checked = true;
        document.getElementById('dynamicRange').value = 0;
        dynamicRangeValue.textContent = '0%';
        document.getElementById('dithering').checked = false;
        document.getElementById('noiseReduction').checked = false;
    }

    // 转换功能
    convertButton.addEventListener('click', startConversion);

    function startConversion() {
        if (!selectedFile) {
            alert('请先选择MP3文件');
            return;
        }

        // 获取用户设置
        const sampleRate = parseInt(document.querySelector('input[name="sampleRate"]:checked').value);
        const bitDepth = parseInt(document.querySelector('input[name="bitDepth"]:checked').value);
        const channels = parseInt(document.querySelector('input[name="channels"]:checked').value);
        const dynamicRangeCompressionValue = parseInt(document.getElementById('dynamicRange').value);
        const useDithering = document.getElementById('dithering').checked;
        const useNoiseReduction = document.getElementById('noiseReduction').checked;

        // 显示进度条
        progressContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        
        // 模拟进度更新
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                completeConversion();
            }
            updateProgress(progress);
        }, 200);

        // 实际转换代码
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            audioContext.decodeAudioData(e.target.result)
                .then(function(audioBuffer) {
                    // 这里实现转换逻辑
                    // 通常我们会在这里处理音频数据
                    // 但由于Web Audio API的限制，完整实现WAV导出需要更复杂的代码
                    
                    // 这里仅做演示，稍后会在completeConversion函数中完成"模拟"转换
                });
        };
        reader.readAsArrayBuffer(selectedFile);
    }

    function updateProgress(value) {
        const percent = Math.round(value);
        progressBar.style.width = percent + '%';
        progressText.textContent = `处理中... ${percent}%`;
    }

    function completeConversion() {
        // 获取设置
        const sampleRate = parseInt(document.querySelector('input[name="sampleRate"]:checked').value);
        const bitDepth = parseInt(document.querySelector('input[name="bitDepth"]:checked').value);
        const channels = parseInt(document.querySelector('input[name="channels"]:checked').value);
        
        // 显示结果容器，隐藏进度条
        progressContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        
        // 读取原始文件以获取音频数据
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: sampleRate});
            
            audioContext.decodeAudioData(e.target.result).then(function(audioBuffer) {
                // 获取实际音频数据
                const duration = audioBuffer.duration;
                const numberOfChannels = channels; // 使用用户选择的声道数
                const length = audioBuffer.length;
                
                // 创建WAV文件
                createWAVFile(audioBuffer, {
                    sampleRate: sampleRate,
                    bitDepth: bitDepth,
                    channels: numberOfChannels
                }).then(function(wavFile) {
                    // 使用实际WAV数据计算文件大小
                    const actualSize = wavFile.byteLength;
                    resultFileSize.textContent = formatBytes(actualSize);
                    
                    // 设置结果文件名和音频信息
                    const newFileName = selectedFile.name.replace(/\.mp3$/i, '.wav');
                    resultFileName.textContent = newFileName;
                    resultAudioInfo.textContent = `${sampleRate}Hz, ${bitDepth}位, ${channels === 1 ? '单声道' : '立体声'}`;
                
                    // 创建可下载的Blob
                    const blob = new Blob([wavFile], {type: 'audio/wav'});
                    const audioURL = URL.createObjectURL(blob);
                    audioPreview.src = audioURL;
                    
                    // 设置下载按钮
                    downloadButton.onclick = function() {
                        const a = document.createElement('a');
                        a.href = audioURL;
                        a.download = selectedFile.name.replace(/\.mp3$/i, '.wav');
                        a.click();
                    };
                });
            });
        };
        reader.readAsArrayBuffer(selectedFile);
    }

    // 添加WAV文件创建函数
    function createWAVFile(audioBuffer, options) {
        const sampleRate = options.sampleRate || audioBuffer.sampleRate;
        const bitDepth = options.bitDepth || 16;
        const channels = options.channels || audioBuffer.numberOfChannels;
        
        // 重采样和处理声道数量
        const offlineCtx = new OfflineAudioContext(channels, audioBuffer.length * sampleRate / audioBuffer.sampleRate, sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start();
        
        return offlineCtx.startRendering().then(function(renderedBuffer) {
            // 处理位深度
            const bytesPerSample = bitDepth / 8;
            const bytesPerFrame = bytesPerSample * channels;
            const dataLength = renderedBuffer.length * bytesPerFrame;
            
            // 创建WAV头部和数据
            const buffer = new ArrayBuffer(44 + dataLength);
            const view = new DataView(buffer);
            
            // WAV文件头
            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + dataLength, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true); // PCM格式
            view.setUint16(22, channels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * bytesPerFrame, true);
            view.setUint16(32, bytesPerFrame, true);
            view.setUint16(34, bitDepth, true);
            writeString(view, 36, 'data');
            view.setUint32(40, dataLength, true);
            
            // 写入音频数据
            const offset = 44;
            let pos = offset;
            
            for (let i = 0; i < renderedBuffer.length; i++) {
                for (let c = 0; c < channels; c++) {
                    const channel = c < renderedBuffer.numberOfChannels ? 
                          renderedBuffer.getChannelData(c) : 
                          new Float32Array(renderedBuffer.length).fill(0);
                          
                    const sample = Math.max(-1, Math.min(1, channel[i]));
                    let value;
                    
                    // 根据位深度处理数据
                    if (bitDepth === 16) {
                        value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                        view.setInt16(pos, value, true);
                        pos += 2;
                    } else if (bitDepth === 24) {
                        value = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
                        view.setUint8(pos, value & 0xFF);
                        view.setUint8(pos + 1, (value >> 8) & 0xFF);
                        view.setUint8(pos + 2, (value >> 16) & 0xFF);
                        pos += 3;
                    } else if (bitDepth === 32) {
                        view.setFloat32(pos, sample, true);
                        pos += 4;
                    }
                }
            }
            
            return buffer;
        });
    }

    // 辅助函数
    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // 初始化
    resetForm();
});