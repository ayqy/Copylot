// Copylot 字符变化动画
class CopylotAnimation {
    constructor() {
        this.animationElement = document.getElementById('letter-animation');
        this.svgContainer = document.getElementById('svg-container');
        this.animatedText = null;
        this.currentPhase = 0;
        this.animationPhases = [
            'Copilot',
            'Copylot'
        ];
        this.letterChangeCount = 0;
        this.maxLetterChanges = 15; // 在切换到最终状态前的字符变化次数（i到y共16次变化：i→j→k→l→m→n→o→p→q→r→s→t→u→v→w→x→y）
        
        this.init();
    }
    
    init() {
        // 初始化动画
        this.startAnimation();
        this.setupEventListeners();
    }
    
    startAnimation() {
        // 设置初始状态
        this.animationElement.innerHTML = 'Copilot';
        this.applyInitialStyling();
        
        // 延迟开始变化动画
        setTimeout(() => {
            this.startLetterTransformation();
        }, 1000);
    }
    
    startLetterTransformation() {
        // 开始字母变化动画
        this.letterChangeCount = 0;
        this.animateLetterChange();
    }
    
    animateLetterChange() {
        const currentText = this.animationElement.textContent;
        
        // 添加变化效果
        this.animationElement.classList.add('changing');
        setTimeout(() => {
            this.animationElement.classList.remove('changing');
        }, 47); // 与字母变化同步
        
        // 随机变化字母
        this.randomizeLetter();
        
        this.letterChangeCount++;
        
        // 检查是否应该开始字母融合动画
        if (this.letterChangeCount >= this.maxLetterChanges) {
            // 直接显示最终状态，不要停顿
            this.forceFinalState();
        } else {
            // 继续变化
            setTimeout(() => {
                this.animateLetterChange();
            }, 47); // 0.75s / 16次变化 ≈ 47ms每次
        }
    }
    
    randomizeLetter() {
        const text = this.animationElement.textContent;
        const letters = text.split('');
        
        // 按字母表顺序从i到y的变化
        const alphabetSequence = ['j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y'];
        
        // 根据当前变化次数确定下一个字母
        const nextChar = alphabetSequence[this.letterChangeCount];
        
        // 找到需要变化的字母位置（第4个位置，即索引3）
        const changeIndex = 3; // Copilot中i的位置
        
        if (changeIndex < letters.length) {
            letters[changeIndex] = nextChar;
            
            const newText = letters.join('');
            console.log(`变化 ${this.letterChangeCount}: ${text} -> ${newText} (字母: ${nextChar})`);
            this.animationElement.innerHTML = newText;
            
            // 应用颜色样式
            this.applyColorStyling(newText);
        }
    }
    
    applyInitialStyling() {
        // 初始状态：所有字母使用深紫色，突出字母i
        this.highlightLetterI();
    }
    
    applyColorStyling(text) {
        // 根据当前文本应用不同的颜色方案
        if (text === 'Copilot') {
            // 突出显示字母i
            this.highlightLetterI();
        } else if (text === 'Copylot') {
            // 最终状态：突出显示字母y
            this.highlightLetterY();
        } else {
            // 变化过程中：突出显示变化的字母
            this.highlightChangingLetter(text);
        }
    }
    
    highlightLetterI() {
        // 突出显示字母i，使其与其他字母形成对比
        const text = this.animationElement.textContent;
        if (text.includes('i')) {
            // 其他字母使用深紫色，字母i使用白色
            const highlightedText = text.replace('i', '<span class="letter-i">i</span>');
            this.animationElement.innerHTML = highlightedText;
            
            // 设置其他字母的颜色
            const letters = this.animationElement.childNodes;
            letters.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    // 文本节点，需要包装每个字母
                    const text = node.textContent;
                    const wrappedText = text.split('').map(letter => 
                        `<span class="letter-other">${letter}</span>`
                    ).join('');
                    node.parentNode.replaceChild(
                        document.createRange().createContextualFragment(wrappedText),
                        node
                    );
                }
            });
        }
    }
    
    highlightLetterY() {
        // 突出显示字母y，使其与其他字母形成对比
        const text = this.animationElement.textContent;
        if (text.includes('y')) {
            // 其他字母使用深紫色，字母y使用白色
            const highlightedText = text.replace('y', '<span class="letter-y">y</span>');
            this.animationElement.innerHTML = highlightedText;
            
            // 设置其他字母的颜色
            const letters = this.animationElement.childNodes;
            letters.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    // 文本节点，需要包装每个字母
                    const text = node.textContent;
                    const wrappedText = text.split('').map(letter => 
                        `<span class="letter-other">${letter}</span>`
                    ).join('');
                    node.parentNode.replaceChild(
                        document.createRange().createContextualFragment(wrappedText),
                        node
                    );
                }
            });
        }
    }
    
    highlightChangingLetter(text) {
        // 突出显示正在变化的字母
        const letters = text.split('');
        let enhancedText = '';
        
        letters.forEach((letter, index) => {
            // 变化的字母位置是索引3（第4个位置）
            if (index === 3) {
                // 变化的字母使用白色
                enhancedText += `<span class="letter-changing">${letter}</span>`;
            } else {
                // 其他字母使用深紫色
                enhancedText += `<span class="letter-other">${letter}</span>`;
            }
        });
        
        this.animationElement.innerHTML = enhancedText;
    }
    
    addSpecialLetterEffects(text) {
        // 这个方法现在由applyColorStyling处理，保留空实现以兼容
    }
    
    startLetterMorphing() {
        // 开始字母融合动画
        console.log('开始字母融合动画');
        
        // 直接切换到最终状态
        setTimeout(() => {
            this.forceFinalState();
        }, 500);
    }
    
    createSVGMorphing() {
        // 这个方法已不再使用，保留空实现以兼容
    }
    
    forceFinalState() {
        // 强制显示最终状态
        this.animationElement.innerHTML = 'Copylot';
        
        // 应用最终颜色样式
        this.applyColorStyling('Copylot');
        
        // 添加完成动画
        this.animationElement.classList.add('changing');
        setTimeout(() => {
            this.animationElement.classList.remove('changing');
        }, 47); // 与字母变化同步
        
        // 延迟显示完成效果，让用户看到最终状态
        setTimeout(() => {
            this.showCompletionEffect();
        }, 500);
    }
    
    showCompletionEffect() {
        // 显示动画完成效果
        const completionText = document.createElement('div');
        completionText.textContent = '✨ 动画完成！';
        completionText.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: var(--brand-primary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            animation: slideIn 0.5s ease-out;
            z-index: 100;
        `;
        
        document.body.appendChild(completionText);
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        // 移除完成提示
        setTimeout(() => {
            document.body.removeChild(completionText);
        }, 3000);
    }
    
    setupEventListeners() {
        // 添加交互事件监听器
        this.animationElement.addEventListener('click', () => {
            this.restartAnimation();
        });
        
        // 添加键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.restartAnimation();
            }
        });
    }
    
    restartAnimation() {
        // 重新开始动画
        console.log('重新开始动画');
        
        // 清理现有状态
        this.letterChangeCount = 0;
        this.currentPhase = 0;
        
        // 清理SVG容器
        this.svgContainer.innerHTML = '';
        
        // 重新初始化
        this.animationElement.innerHTML = 'Copilot';
        this.applyInitialStyling();
        
        this.startAnimation();
    }
}

// 页面加载完成后初始化动画
document.addEventListener('DOMContentLoaded', () => {
    // 直接启动动画
    new CopylotAnimation();
});

// 添加全局样式
const globalStyles = document.createElement('style');
globalStyles.textContent = `
    /* 全局动画样式 */
    .fade-in {
        animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    /* 鼠标悬停效果 */
    .letter-display:hover {
        cursor: pointer;
        transform: scale(1.02);
        transition: transform 0.3s ease;
    }
    
    /* 提示信息 */
    .hint {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        z-index: 100;
    }
`;
document.head.appendChild(globalStyles);

// 添加提示信息
setTimeout(() => {
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = '点击动画区域或按 R 键重新开始';
    document.body.appendChild(hint);
    
    setTimeout(() => {
        if (hint.parentNode) {
            document.body.removeChild(hint);
        }
    }, 5000);
}, 2000); 