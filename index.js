const fs = require('fs');
const ps = require('child_process');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

// 確認目錄是否為合法的bare git repo名稱
const isGitRepo = function (item) {
    return !!item.match(/^\w+\.git$/gi);
}

// 找出陣列內所有合法的bare git repo元素
const getDirGitRepoList = (items) => {
    const gitRepoList = [];
    items.forEach(element => {
        if (isGitRepo(element)) {
            gitRepoList.push(element);
        }
    });
    return gitRepoList;
}

// 同步讀取使用者的輸入
const readlineSync = () => new Promise((resolve, reject) => {
    readline.question('Input clone path:(no input is current work path)\n', (input) => {
        readline.close()
        return resolve(input);
    });
})

// 同步取得指定目錄的bare git repo名稱
const getDirGireRepoSync = (path = __dirname) => new Promise((resolve, reject) => {
    fs.readdir(path, (err, items) => {
        if (err) {
            console.error(err);
            return reject(err);
        }
        return resolve(getDirGitRepoList(items));
    });
});

// 同步執行git clone的動作，將bare repo轉為workspace file
const cloneGitRepoSync = (input, repoList) => new Promise((resolve, reject) => {
    // 存放結果
    const res = { ok: [], err: [] };
    // repoList的處理計數(完成一件就減掉1)
    let cnt = repoList.length;
    repoList.forEach((element) => {
        const path = `${input}\\${element}`;
        // 使用非同步的同步執行git clone命令
        ps.exec(`git clone ${path}`, (error, stdout, stderr) => {
            // 綠字：\x1b[32m 紅字：\x1b[31m 預設：\x1b[0m 
            // 印出指令訊息
            if(stdout) {
                console.log(`\x1b[32m${stdout}\x1b[0m`);
            }
            if(stderr) {
                console.log(`\x1b[32m${stderr}\x1b[0m`);
            }
            
            // 錯誤訊息物件
            const errObj = {target: null, stdErrMsg: null, nodeErr: null };

            // 執行指令錯誤
            if (error) {
                console.log(`\x1b[31m${error}\x1b[0m`)
                if (stderr) {
                    errObj.stdErrMsg = stderr;
                }
                errObj.nodeErr = error;
                errObj.target = path;
                res.err.push(errObj)
            }
            else {
                res.ok.push(path);
            }
            cnt--;
        });
    });
    
    // 確認是否所有目錄下的目標都處理完成
    const check = (isDone) => {
        setTimeout(() => {
            if (isDone) {
                return resolve(res)
            }
            check(cnt === 0);
        }, 0);
    }
    return check(cnt === 0);
});

// main
(async () => {
    const input = await readlineSync();
    const repoList = await getDirGireRepoSync(input ? input : __dirname);
    console.log(await cloneGitRepoSync(input ? input : __dirname, repoList));
})();
