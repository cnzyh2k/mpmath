// 修改MathJax全局配置，使微信编辑器能保存下来
MathJax = {
    svg: { fontCache: 'none' },
    tex: { tags: 'ams' }
};

let input = document.getElementById('input');
let block = document.getElementById('block');
let insert = document.getElementById('insert');

// 判断输入是否为空
function checkNull(str) {
    if (str.length == 0) {
        insert.disabled = true;
        $(insert).addClass('weui-desktop-btn_disabled');
    } else {
        insert.disabled = false;
        $(insert).removeClass('weui-desktop-btn_disabled');
    }
}

// Tex代码转SVG图像
function convert() {
    let inputTex = document.getElementById("input").value.trim();
    checkNull(inputTex);

    output = document.getElementById('output');
    output.innerHTML = '';

    MathJax.texReset();
    let options = MathJax.getMetricsFor(output);
    options.display = block.checked;
    MathJax.tex2svgPromise(inputTex, options).then(function (node) {
        output.appendChild(node);
        MathJax.startup.document.clear();
        MathJax.startup.document.updateDocument();
    }).catch(function (err) {
        output.appendChild(document.createElement('pre')).appendChild(document.createTextNode(err.message));
    }).then(function () {
        inputTex.disabled = false;
    });
}

// 请求关闭公式编辑页面
function closeFrame() {
    parent.window.postMessage({ type: 'CLOSE_FORMULA' }, '*');
}

function insertFormula() {
    if (insert.disabled == true) return;

    // 将生成的mjx-container套在span中
    let output = document.getElementById('output');

    // 微信公众号的新策略会丢弃 max-width: 300% 这样的修饰
    // 对于含有 viewBox 的 SVG，我们可以确保它的 width/height 样式或者直接通过包含元素的宽度来撑开
    let svg = output.querySelector('svg');
    if (svg) {
        svg.style.maxWidth = 'none';
        svg.style.verticalAlign = 'middle';
    }

    let sp = document.createElement('span');
    sp.setAttribute('style', 'cursor:pointer; display:inline-block;');

    if ($(block).prop('checked')) {
        // Block 级公式（行间公式）
        sp.style.display = 'block';
        sp.style.textAlign = 'center';
        sp.style.margin = '15px 0';
        sp.style.overflowX = 'auto'; // 允许水平滚动

        // 设置一些微信能兼容的样式
        output.childNodes[0].setAttribute('display', true);
        output.childNodes[0].style.display = 'inline-block';
        output.childNodes[0].style.lineHeight = 'normal';
        if (svg) {
            svg.style.display = 'block';
            svg.style.margin = '0 auto';
        }
    } else {
        // 行内公式
        if (svg) {
            svg.style.display = 'inline-block';
        }
    }

    //output.childNodes[0].setAttribute('data-formula', input.value.trim().replace(/\\/g, '\\\\'));
    output.childNodes[0].setAttribute('data-formula', input.value.trim());
    sp.appendChild(output.childNodes[0]);
    sp.innerHTML = sp.innerHTML.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");

    parent.window.postMessage({ type: 'INSERT_FORMULA', text: sp.outerHTML }, '*');
    input.value = '';
    closeFrame();
}

$(function () {
    input.oninput = convert;
    block.onchange = convert;
    insert.onclick = insertFormula;
    document.getElementById('close').onclick = closeFrame;
    document.getElementById('cancel').onclick = closeFrame;

    window.addEventListener('message', function (event) {
        // 接收来自主页面的消息，改变输入框内容
        if (event.data.type) {
            if (event.data.type == 'CHANGE_INPUT') {
                //input.value = event.data.text.replace(/\\\\/g, '\\');
                input.value = event.data.text;
                input.focus();

                // 行间公式自动勾选
                if (event.data.isBlock == "true") $(block).prop('checked', true);
                else $(block).prop('checked', false);
                convert();
            }
        }
    });

    // 防止窗口失去焦点
    $(window).focusout(function () {
        setTimeout(function () {
            $('#input').focus();
        }, 10);
    });

    $('#input').keydown(function (event) {
        // 处理shift+enter
        if (event.keyCode == 13 && event.shiftKey) {
            insertFormula();
        }
    });

    $(document).keydown(function (event) {
        // 处理esc
        if (event.keyCode == 27) {
            closeFrame();
        }
    });
});