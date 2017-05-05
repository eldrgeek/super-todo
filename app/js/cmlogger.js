let debounce = require("debounce")
let SourceMap = require("source-map")
export default class CMLogger {
    //class CMLogger {
    constructor(cm, map) {
        this.cm = cm
        this.logLines = []
        this.smcs = []
        this.addSourceMap(map, 0)
        this.clearLogs()
        this.cm.Logger = this;
        this.log = this.log.bind(this)
        this.showData = debounce(this.showData.bind(this), 100)
    }

    clearByClass(className) {
        let logs = document.getElementsByClassName(className);
        let n = logs.length
        for (let i = 0; i < n; i++) {
            let log = logs[i]
            log.parentElement.removeChild(log)
        }
    }
    clearLogs() {
        this.clearByClass("logdata")
        this.clearByClass("errormessage");
    }
    logErrorAtLine(line, text) {
        this.logAtLine(line, text, "errormessage")
    }
    logMessageAtLine(line, text) {
        this.logAtLine(line, text, "logdata")
    }
    logAtLine(line, text, className) {
        console.log("LINE")
        let ch = this.cm.getLine(line).length
        this.logAtPos({ line, ch }, text, className)
    }
    logAtPos(pos, text, className) {
        console.log("POSITION", pos)
        let node = document.createElement("span")
        node.innerHTML = text
        node.className = className;
        this.cm.addWidget(pos, node)
    }
    
    showData() {
        let values = this.logLines;
        let n = values.length;
        for (let i = 0; i < n; i++) {
            let value = values[i]
            if (value) {
                //console.log(value, i)
                this.logMessageAtLine(i - 1, value);
            }
        }
    }
    logDataAt(line, value) {
        let values = this.logLines[line]
        if (!values) {
            this.logLines[line] = values = []
        }
        values.push(value);
        this.showData()
    }

    addSourceMap(map, offset) {

        this.smcs.push({
            map: (new SourceMap.SourceMapConsumer(map)),
            offset: offset
        }
        )
    }
    getPosition(spec) {
        let n = this.smcs.length - 1;
        for (let i = n; i > -1; i--) {
            let pos = this.smcs[i].map.originalPositionFor(spec)
            pos.line += this.smcs[i].offset
            //console.log(pos);
            if (pos.source) return pos;
        }
    }

    parseStackFrame(frame) {
        let matcher = frame.match(/at\s+(\S*).*:(\d+):(\d+)\)$/)
        if (matcher) {
            //console.log(matcher)
            let name = matcher[1]
            let line = +matcher[2]
            let column = +matcher[3]
            //console.log(name,line,column);
            return this.getPosition({ line, column })
        }
    }
    log(output) {
        let line = this.getCallerLine(1);
        //console.log(line, output)
        this.logDataAt(line, output)
    }

    getCallerLine(n) {
        let stackFrames = new Error().stack.split("\n")
        return this.parseStackFrame(stackFrames[2 + n]).line
    }
    displayError(e) {
        let stackFrames = e.stack.split("\n")
        let line = this.parseStackFrame(stackFrames[1]).line - 1
        let message = stackFrames[0]
        this.logErrorAtLine(line - 1, message)
    }
}

if (false) {
    console.clear()
    debounce = exported.debounce
    let Logger = new CMLogger(this.cm, exported.output.map);
    let log = this.cm.Logger.log
    log("This is it a teest")
    try {
        throw new Error("WOW");
    } catch (e) {
        Logger.displayError(e);
    }
}