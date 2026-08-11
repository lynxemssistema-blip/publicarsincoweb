import React from 'react';
import { X, Wrench } from 'lucide-react';
import MontaPecaManufaturadaPage from '../pages/MontaPecaManufaturada';

interface ModalMontagemProcessoFabricacaoProps {
  isOpen: boolean;
  onClose: () => void;
  codmatfabricante?: string;
  osId?: string | number;
  osContext?: any;
  qtdSelecionada?: number;
}

export default function ModalMontagemProcessoFabricacao({
  isOpen,
  onClose,
  codmatfabricante,
  osId,
  osContext,
  qtdSelecionada
}: ModalMontagemProcessoFabricacaoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#32423D] text-white shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E0E800]/20 flex items-center justify-center text-[#E0E800]">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold flex items-center gap-2">
                Montagem Processo Fabricação
                {codmatfabricante && (
                  <span className="text-xs bg-[#E0E800] text-black font-extrabold px-2 py-0.5 rounded">
                    {codmatfabricante}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-gray-300">
                Cadastre e vincule os recursos e tempos de produção deste material. Ao concluir, feche esta janela para retornar à O.S.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 hover:bg-red-600/80 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Fechar e retornar para inclusão de materiais na O.S."
          >
            <X size={16} /> Fechar e Retornar
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-slate-100 p-1">
          <MontaPecaManufaturadaPage 
            initialCodMatFabricante={codmatfabricante} 
            osId={osId} 
            osContext={osContext}
            qtdSelecionada={qtdSelecionada} 
          />
        </div>
      </div>
    </div>
  );
}
