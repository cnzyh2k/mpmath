function formulaClick(event) {
    $('#popup').css('display', 'block');
    $('#popup')[0].contentWindow.postMessage({ type: 'CHANGE_INPUT', text: '' }, '*');
    $('#popup')[0].focus();
    $('.tpl_dropdown_menu', '.formula').css('display', 'none');
    if (event) event.stopPropagation();
}

function fixClick(event) {
    revise();
    $('.tpl_dropdown_menu', '.formula').css('display', 'none');
    event.stopPropagation();
}

function guideClick(event) {
    alert('【mpMath 微信公众号公式插件 v0.2.4】\n\n' +
        '本插件是基于 GitHub 开源项目 latentcat/mpmath 进行的二次开发与升级，旨在修复原版在微信新版编辑器下的失效问题，并增强了长公式的显示效果。\n\n' +
        '【使用方式】\n' +
        '1. 插入公式：点击“配置栏” -> “公式” -> “插入公式”（或快捷键 Cmd/Ctrl + /）唤出配置面板，输入 TeX 代码后完成插入。\n' +
        '2. 行间公式：勾选“行间公式”可使公式居中并占满一行，适合展示大型、长段或带有层叠标注的数学等式。\n' +
        '3. 修复 SVG：从外部排版工具粘贴进来的公式如出现显示异常，可点击“修复SVG”一键转换嵌入格式使其恢复原样。\n\n' +
        '【实现功能】\n' +
        '- 支持标准 TeX/LaTeX 语法实时预览与插入。\n' +
        '- 自动识别微信编辑器 API 环境，支持原生插入或“智能复制粘贴”双重保护机制。\n' +
        '- 深度优化 SVG 渲染机制，支持长公式水平滚动，防止文章端渲染挤压。\n\n' +
        '【版权声明】\n' +
        '- 原始库: https://github.com/latentcat/mpmath\n' +
        '- 本次维护及升级 by: zyh2k 20260228\n' +
        '- 协议: MIT License (免费且开源，欢迎分发)');
    $('.tpl_dropdown_menu', '.formula').css('display', 'none');
    if (event) event.stopPropagation();
}

// 当前编辑对象和是否在编辑(插入)模式
let editing, editingMode;

window.addEventListener("message", function (event) {
    if (!event.data.type) return;

    if (event.data.type == 'CLOSE_FORMULA') {
        let popup = document.getElementById('popup');
        if (popup) popup.style.display = 'none';

        // 尝试重置焦点
        let ueditor = document.getElementById('ueditor_0');
        if (ueditor) {
            if (ueditor.tagName === 'IFRAME') setTimeout(function () { ueditor.contentWindow.focus(); }, 10);
            else setTimeout(function () { ueditor.focus(); }, 10);
        }
        editingMode = false;
    }
    else if (event.data.type == 'INSERT_FORMULA') {
        let htmlSnippet = '\xA0' + event.data.text + '\xA0';

        if (editingMode == true && editing) {
            let beg = event.data.text.indexOf('>') + 1;
            let end = event.data.text.lastIndexOf('<') - 1;
            editing.innerHTML = event.data.text.substring(beg, end);
            editingMode = false;
        } else {
            let success = false;
            let ueditor = document.getElementById('ueditor_0');
            try {
                if (ueditor) {
                    if (ueditor.tagName === 'IFRAME') {
                        ueditor.contentWindow.focus();
                        success = ueditor.contentWindow.document.execCommand('insertHTML', false, htmlSnippet);
                    } else {
                        ueditor.focus();
                        success = document.execCommand('insertHTML', false, htmlSnippet);
                    }
                } else {
                    success = document.execCommand('insertHTML', false, htmlSnippet);
                }
            } catch (e) {
                console.warn('mpMath insert failed:', e);
                success = false;
            }

            // 回退：直接通过 navigator.clipboard API 或者强制让用户手动复制
            if (!success) {
                try {
                    // 创建一个隐藏的临时输入框来进行复制操作
                    let tempInput = document.createElement("textarea");
                    tempInput.value = htmlSnippet;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand("copy");
                    document.body.removeChild(tempInput);
                    alert('受微信编辑器安全限制，已为您【复制】了公式代码！\n\n请在文章空白处按快捷键 [Ctrl+V] 或 [Cmd+V] 手动粘贴即可显示公式！');
                } catch (err) {
                    console.error('Copy fallback failed', err);
                    alert('由于微信编辑器限制，请在随后弹出的窗口中手动复制！');
                    prompt("请按 Ctrl+C / Cmd+C 复制以下公式，然后在微信编辑器中粘贴：", htmlSnippet);
                }
            }
        }
    }
});

// 等待文档加载完毕
chrome.runtime.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === 'complete') {
            clearInterval(readyStateCheckInterval);

            if ($('#js_media_list')[0]) {
                // 公式编辑弹窗
                let iframe = document.createElement('iframe');
                iframe.src = chrome.runtime.getURL('./pages/popup.html');
                iframe.setAttribute('class', 'mpm-modal');
                iframe.frameBorder = 0;
                iframe.allowTransparency = true;
                iframe.id = 'popup';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                console.log(iframe)

                // 上方菜单栏公式按钮
                let formulaMenu = document.createElement('li');
                formulaMenu.setAttribute('class', 'tpl_item tpl_item_dropdown jsInsertIcon formula');
                formulaMenu.id = 'js_editor_insert_formula';
                $(formulaMenu).append('<span>公式</span>');

                // 分别为 下拉菜单栏、插入公式、修复SVG、指南
                let dropdownMenu = document.createElement('ul');
                dropdownMenu.setAttribute('class', 'tpl_dropdown_menu');
                dropdownMenu.style.display = 'none';

                let formulaInsertItem = document.createElement('li');
                formulaInsertItem.setAttribute('class', 'tpl_dropdown_menu_item');
                formulaInsertItem.innerText = '插入公式 ⌘/';
                formulaInsertItem.onclick = formulaClick;
                dropdownMenu.appendChild(formulaInsertItem);

                let formulaFixItem = document.createElement('li');
                formulaFixItem.setAttribute('class', 'tpl_dropdown_menu_item');
                formulaFixItem.innerText = '修复SVG';
                formulaFixItem.onclick = fixClick;
                dropdownMenu.appendChild(formulaFixItem);

                let formulaGuide = document.createElement('li');
                formulaGuide.setAttribute('class', 'tpl_dropdown_menu_item');
                formulaGuide.innerText = '指南';
                formulaGuide.onclick = guideClick;
                dropdownMenu.appendChild(formulaGuide);

                formulaMenu.appendChild(dropdownMenu);
                $(formulaMenu).click(function () {
                    $(dropdownMenu).css('display', 'none');
                });

                $(document).click(function (event) {
                    // 检查点击的元素是否是formulaMenu
                    if (!$(event.target).closest(formulaMenu).length) {
                        // 如果不是，下拉菜单消失
                        $(dropdownMenu).css('display', 'none');
                    }
                    else {
                        // 如果是，下拉菜单显示
                        $(dropdownMenu).css('display', 'block');
                    }
                });

                $('#js_media_list')[0].appendChild(formulaMenu);

                // 热键绑定 Ctrl/⌘ + /
                let viewTarget = $('#ueditor_0').contents().find('.view');
                if (viewTarget.length === 0) viewTarget = $('#ueditor_0'); // fallback

                viewTarget.keydown(function (event) {
                    let keyCode = event.keyCode || event.which || event.charCode;
                    let ctrlKey = event.ctrlKey || event.metaKey;
                    if (ctrlKey && keyCode == 191) {
                        formulaClick();
                    }
                });

                // 编辑事件监听
                viewTarget.on('click', '[data-formula]', function (event) {
                    $('#popup')[0].style.display = 'block';
                    $('#popup')[0].contentWindow.postMessage({ type: 'CHANGE_INPUT', text: $(this).attr('data-formula'), isBlock: $(this).attr('display') }, '*');
                    setTimeout(function () { $('#popup')[0].focus(); }, 10);
                    editing = this.parentElement;
                    editingMode = true;
                });
            }
        }
    }, 10);
});

/*
以下代码源于 https://github.com/kongxiangyan/bookmarklet
修复修正微信公众号图文编辑器粘贴 SVG 时部分转换为 Embed 导致不支持 Dark Mode 的问题
*/
function loadSVG(src) {
    return new Promise((resolve) => {
        let ajax = new XMLHttpRequest();
        ajax.open('GET', src, true);
        ajax.send();
        ajax.onload = function (e) {
            let div = document.createElement('div');
            div.innerHTML = ajax.responseText;
            let svg = div.childNodes[1];
            resolve(svg);
        }
    })
}

function revise() {
    console.log(`【MP_SVG_REVISE】 Start`);
    let ueditor = document.getElementById('ueditor_0');
    if (!ueditor) {
        alert("未找到编辑器实例，此页面可能采用了新版结构或不包含文章。");
        return;
    }

    let view;
    if (ueditor.tagName === 'IFRAME') {
        try {
            if (!ueditor.contentWindow || !ueditor.contentWindow.document) {
                alert('由于安全限制（跨域），无法直接访问编辑器内容，修复失败。');
                return;
            }
            view = ueditor.contentWindow.document.getElementsByClassName('view')[0] || ueditor.contentWindow.document.body;
        } catch (e) {
            console.error('Cross-origin frame block:', e);
            alert('获取编辑器内容被浏览器安全策略拦截，修复失败。');
            return;
        }
    } else {
        view = ueditor;
    }

    let embeds = view.querySelectorAll('embed');
    console.log(`【MP_SVG_REVISE】 检测到 ${embeds.length} 个目标……`);
    let promises = [];
    embeds.forEach((embed, index) => {
        console.log(`【MP_SVG_REVISE】 第 ${index} 个……`);
        let parent_node = embed.parentNode;
        promises.push(new Promise(resolve => {
            loadSVG(embed.src).then(svg => {
                parent_node.insertBefore(svg, embed);
                parent_node.removeChild(embed);
                resolve();
            })
        }))
    });
    Promise.all(promises).then(() => {
        console.log('Revise complete！');
        //alert('Revise complete！');
        alert(`修复了 ${embeds.length} 个目标!`);
    })
}