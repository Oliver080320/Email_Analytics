// Display formatting only; underlying ISO values retain chronological sorting.
export function displayDate(value){
 if(value===null||value===undefined)return '';
 return String(value).replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,(_,y,m,d)=>`${d}-${m}-${y}`).replace(/\b(\d{4})-(\d{2})\b/g,(_,y,m)=>`${m}-${y}`);
}
