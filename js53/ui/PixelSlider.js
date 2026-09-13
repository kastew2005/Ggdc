export class PixelSlider{
  constructor(input,{audio=null,onInput=null,format=v=>v}={}){this.input=input;this.audio=audio;this.onInput=onInput;this.format=format;if(!input)return;input.classList.add('pixelSlider');this.output=input.parentElement?.querySelector('output');this.bind()}
  bind(){this.input.addEventListener('input',()=>{this.render();this.onInput?.(this.value)});this.input.addEventListener('change',()=>{this.audio?.ensure?.();this.audio?.uiClick?.()});this.render()}
  get value(){return Number(this.input.value)}
  render(){const v=this.format(this.value);if(this.output)this.output.textContent=v;this.input.style.setProperty('--slider-pct',((this.value-Number(this.input.min||0))/(Number(this.input.max||100)-Number(this.input.min||0))*100)+'%')}
}
