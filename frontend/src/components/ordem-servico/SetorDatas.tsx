import { memo } from 'react';

// Converte qualquer data para dd/mm/aaaa sem deslocamento de fuso horário
// Regra: datas devem SEMPRE ser exibidas no formato 'dd/mm/aaaa'
const formatDateBR = (dateStr?: string): string => {
    if (!dateStr || dateStr === '-') return '-';
    try {
        // Já está no formato dd/mm/aaaa
        if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) return dateStr.split(' ')[0];
        // Formato ISO YYYY-MM-DD → extrair via regex para evitar offset UTC (-3h)
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
        // Fallback via objeto Date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day   = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year  = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return dateStr;
    }
};

export const SetorDatas = memo(({ nome, planejadoInicio, planejadoFim, realizadoInicio, realizadoFim, forceShow }: {
 nome: string;
 planejadoInicio?: string;
 planejadoFim?: string;
 realizadoInicio?: string;
 realizadoFim?: string;
 forceShow?: boolean;
}) => {
 const hasData = planejadoInicio || planejadoFim || realizadoInicio || realizadoFim;
 if (!hasData && !forceShow) return null;

 const pI = formatDateBR(planejadoInicio);
 const pF = formatDateBR(planejadoFim);
 const rI = formatDateBR(realizadoInicio);
 const rF = formatDateBR(realizadoFim);

 return (
 <div className="bg-white rounded-lg p-2 border border-gray-100 dark:bg-card dark:border-border">
 <div className="text-xs font-semibold text-primary mb-1">{nome}</div>
 <div className="grid grid-cols-2 gap-x-3 text-[10px]">
 {(planejadoInicio || planejadoFim) ? (
 <>
 <div className="text-gray-400">Planejado:</div>
 <div className="text-gray-600 dark:text-gray-400">{pI} a {pF}</div>
 </>
 ) : (
 <>
 <div className="text-gray-300 col-span-2 italic">Sem datas planejadas</div>
 </>
 )}
 {(realizadoInicio || realizadoFim) && (
 <>
 <div className="text-gray-400">Realizado:</div>
 <div className="text-gray-600 dark:text-gray-300 font-medium">{rI} a {rF}</div>
 </>
 )}
 </div>
 </div>
 );
});
