'use client'

import Typewriter from 'typewriter-effect'

export function TypewriterText() {
  return (
    <div className="text-muted-foreground mx-auto max-w-[800px] px-4 text-center text-base md:text-lg lg:text-xl">
      <div className="flex flex-col items-center justify-center">
        <div className="min-h-[28px] min-w-[200px] md:min-w-[250px] lg:min-w-[300px]">
          <Typewriter
            options={{
              loop: true,
              autoStart: true,
              deleteSpeed: 30,
              delay: 30,
            }}
            onInit={(typewriter) => {
              typewriter
                .typeString(
                  '<span class="text-primary font-semibold">Deixe o trabalho de encontrar a skin que você deseja com a gente.</span>',
                )
                .pauseFor(2000)
                .deleteAll()
                .typeString(
                  '<span class="text-primary font-semibold">Não encontrou o que procurava?</span>',
                )
                .pauseFor(2000)
                .deleteAll()
                .typeString(
                  '<span class="text-primary font-semibold">Solicite.</span>',
                )
                .pauseFor(2000)
                .deleteAll()
                .start()
            }}
          />
        </div>
        <span>
          - em poucas horas, nosso time responsável irá te entregar a skin que
          você deseja.
        </span>
      </div>
    </div>
  )
}
