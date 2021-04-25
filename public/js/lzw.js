class LzwEncoder {
    constructor(logDecode) {
        this.isDecodeLogOn = logDecode;
    }

    buildRootDict(charStream) {
        const rootDict = {};
        let i = 0;
        for (const c of charStream) {
            if (!rootDict[c]) {
                rootDict[c] = ++i;
            }
        }
        return {
            dict: rootDict,
            length: i
        };
    }

    encode(imageCharStream) {
        const rootDict = this.buildRootDict(imageCharStream);
        const dict = { ...rootDict.dict };
        let dictLength = rootDict.length;

        const codeStream = [];
        let p = '';
        let step = 0;
        for (const c of imageCharStream) {
            let tableData = `
                <th scope="row">${++step}</th>
                <td>${p || '--'}</td>
                <td>${c}</td>
            `;

            if (dict[p+c]) {
                tableData += `
                    <td>--</td>
                    <td>--</td>
                `;
                p = p+c
            }
            else {
                tableData += `
                    <td>${p+c}(${dictLength + 1})</td>
                    <td>${dict[p]}</td>
                `;
                dict[p+c] = ++dictLength;
                codeStream.push(dict[p]);
                p = c;
            }

            $("#lzwCompressTable > tbody").append(`<tr>${tableData}</tr>`);
        }

        $("#lzwCompressTable > tbody").append(`
            <tr>
                <th scope="row">${++step}</th>
                <td>${p || '--'}</td>
                <td>--</td>
                <td>--</td>
                <td>${dict[p]}</td>
             </tr>
        `);

        codeStream.push(dict[p]);
        const codeStreamSize = codeStream.length;
        const rootDictSize = rootDict.length;
        const imageCharStreamSize = imageCharStream.length;
        const efficiency = ((1 - (codeStreamSize + rootDictSize) / imageCharStreamSize) * 100).toFixed(2) + '%';

        $('#lzwRootDict').html(JSON.stringify(rootDict.dict));
        $('#lzwCodeStream').html(codeStream);
        $('#lzwCompressEfficiency').html(efficiency);
        return { rootDict, codeStream, efficiency };
    }

    initWordDictArr(rootDict) {
        const wordDictArr = new Array(rootDict.length);
        for (const [key, value] of Object.entries(rootDict.dict))
            wordDictArr[value - 1] = key;

        return wordDictArr;
    }

    decode({ rootDict, codeStream }) {
        const charOutputStream = new Array(codeStream.length);
        const wordDictArr = this.initWordDictArr(rootDict);
        let cW = codeStream[0];
        let cWString = wordDictArr[cW - 1];
        charOutputStream[0] = cWString;

        let step = 0;
        if (this.isDecodeLogOn) {
            console.log('step', ++step);
            console.log('pW:', '--');
            console.log('cW:', cW);
            console.log('p:', '--');
            console.log('c:', '--');
            console.log('output:', charOutputStream[0]);
            console.log('dict[p+c]:', '--');
            console.log('-----------');
        }
        for (let i = 1; i < codeStream.length; i++) {
            const pW = cW;
            const pWString = wordDictArr[pW - 1];

            cW = codeStream[i];
            cWString = wordDictArr[cW - 1];

            const p = pWString;
            const c = cWString ? cWString[0] : p[0];

            charOutputStream[i] = cWString || p + c;
            wordDictArr.push(p + c);

            if (this.isDecodeLogOn) {
                console.log('step', ++step);
                console.log('pW:', pW);
                console.log('cW:', cW);
                console.log('p:', p);
                console.log('c:', c);
                console.log('output:', charOutputStream[i]);
                console.log('dict[p+c]:', `(${wordDictArr.length})${p+c}`);
                // console.log(wordDictArr);
                console.log('-----------');
            }
        }

        return charOutputStream.join('');
    }
}