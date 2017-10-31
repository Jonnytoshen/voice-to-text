import { Component, OnInit, NgZone } from "@angular/core";
import { android, AndroidApplication, } from 'application';
import { Feedback, FeedbackType } from 'nativescript-feedback';
import { LoadingIndicator } from 'nativescript-loading-indicator';

declare var com;
declare var org;

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {

    text: string = '请点击开始说话，进行语音录入！';
    feedback: Feedback;
    loader: LoadingIndicator;
    mAsr: any;
    volume: number;

    constructor(
        private zone: NgZone
    ) {
    }
    
    ngOnInit(): void {
        this.feedback = new Feedback();
        this.loader = new LoadingIndicator();
        com.iflytek.cloud.SpeechUtility.createUtility(android.currentContext, "appid=59f68853");
        this.mAsr = com.iflytek.cloud.SpeechRecognizer.createRecognizer(android.context, new com.iflytek.cloud.InitListener({
            onInit: (code: number) => {
                console.log("SpeechRecognizer init() code = " + code);
                if (code != com.iflytek.cloud.ErrorCode.SUCCESS) {
                    this.feedback.error({message:"初始化失败,错误码："+code});
                }
            }
        }));;
        this.mAsr.setParameter(com.iflytek.cloud.SpeechConstant.CLOUD_GRAMMAR, null );
        this.mAsr.setParameter(com.iflytek.cloud.SpeechConstant.SUBJECT, null );
        
        this.mAsr.setParameter(com.iflytek.cloud.SpeechConstant.ENGINE_TYPE, com.iflytek.cloud.SpeechConstant.TYPE_CLOUD);
        this.mAsr.setParameter(com.iflytek.cloud.SpeechConstant.TEXT_ENCODING,"utf-8");
    }

    onClick(): void {
        this.startVoice();
    }

    startVoice(): void {
        let ret = this.mAsr.startListening(new com.iflytek.cloud.RecognizerListener({
            onVolumeChanged: (volume: number, data: Array<any>) => {
                this.volume = volume;
                console.log("返回音频数据："+data.length);
            },
            onResult: (result: any, isLast: boolean) => {
                if (null != result) {
                    console.log("recognizer result：" + result.getResultString());
                    let text: string = this.parseGrammarResult(result.getResultString());                    
                    // 显示
                    this.zone.run(() => {
                        this.text += text;      
                    });
                    console.log("您说的是：" + text);        
                } else {
                    console.log("recognizer result : null");
                }	
            },
            onEndOfSpeech: () => {
                // 此回调表示：检测到了语音的尾端点，已经进入识别过程，不再接受语音输入
                console.log("结束说话");
                this.loader.hide();
            },
            onBeginOfSpeech: () => {
                // 此回调表示：sdk内部录音机已经准备好了，用户可以开始语音输入
                console.log("开始说话");
                this.loader.show({ message: '咩，正在听您说话...' });
                this.text = '';
            },
            onError: (error: any) => {
                this.loader.hide();
                this.feedback.error({ message: "onError Code："	+ error.getErrorCode() });
                console.log("onError Code："	+ error.getErrorCode());
            },
            onEvent: (eventType: number, arg1: number, arg2: number, obj: any) => {

            }
        }));
    }


    parseGrammarResult(json: string): string {
        let ret: string[] = [],
            joResult: object = JSON.parse(json),
            words: object[] = joResult['ws'];
        for(let i = 0; i < words.length; i++) {
            let items = words[i]['cw'];
            for(let j = 0; j < items.length; j++) {
                let obj = items[j];
                ret.push(obj['w']);
            }
        }
        return ret.join('');
    }
}
