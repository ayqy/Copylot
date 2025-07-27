function AnimatedText(target,texts,changeInterval,updateInterval,onTextChanged){
	var currentText=parseInt(Math.random()*texts.length);
	var areaText=texts[0];
	this.t1=setInterval(function(){
		var c=parseInt(Math.random()*Math.max(texts[currentText].length,areaText.length));
		var s=texts[currentText][c];
		if(typeof s == 'undefined') s=" ";
		while(areaText.length<c) areaText+=" ";
		var newText=(areaText.slice(0,c)+s+areaText.slice(c+1)).trim();
		var diff=!(newText==areaText);
		areaText=newText;
		if(onTextChanged&&diff) onTextChanged();
		target.innerHTML=areaText.length==0?"&nbsp;":areaText;
	}.bind(this),updateInterval?updateInterval:50);
	this.t2=setInterval(function(){
		currentText=parseInt(Math.random()*texts.length);
	}.bind(this),changeInterval?changeInterval:4000);
}
AnimatedText.prototype={
	constructor:AnimatedText,
	stop:function(){clearInterval(this.t1);clearInterval(this.t2);}
};