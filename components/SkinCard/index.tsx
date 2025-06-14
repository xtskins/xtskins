'use client'

import {
  CheckCircleIcon,
  LockKeyholeIcon,
  Info,
  BadgePercent,
  ShoppingBag,
  Trash2,
  Eye,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import { useTheme } from 'next-themes'

interface SkinData {
  id: string
  marketname: string
  price: string
  discount_price: string
  discount: number
  image: string
  rarity: string
  color: string
  wear: string
  float_value: number | null
  stickers: Array<{
    name: string
    image: string
  }>
  charms: Array<{
    name: string
    image: string
  }>
  inspectlink: string
  tradable: boolean
  is_visible: boolean
}

interface SkinCardProps {
  skinData: SkinData
}

export default function SkinCard({ skinData }: SkinCardProps) {
  const [inCart, setInCart] = useState(false)
  const { theme } = useTheme()

  const handleCartAction = () => {
    setInCart(!inCart)
  }

  const priceInReais = parseFloat(skinData.price)
  const discountPrice = parseFloat(skinData.discount_price)

  return (
    <div className="flex justify-center">
      <div
        className={`group relative mx-auto flex h-[575px] max-w-[300px] flex-col justify-between rounded-lg bg-white pt-4 drop-shadow-2xl hover:shadow-2xl hover:duration-500 dark:bg-[#141414] lg:h-[550px] lg:w-[265px] ${
          !skinData.is_visible ? 'hidden' : ''
        }`}
      >
        {skinData.tradable ? (
          <div className="absolute left-0 top-0 flex items-center gap-2 rounded-md bg-green-500 px-2 py-1 text-xs font-bold text-white">
            <CheckCircleIcon size={16} />
            <span>Troca imediata</span>
          </div>
        ) : (
          <div className="absolute left-0 top-0 flex items-center gap-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
            <LockKeyholeIcon size={16} />
            <span>Bloqueado</span>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger>
            {skinData.discount < 0 && (
              <Info className="absolute right-0 z-20 mr-4" />
            )}
            {skinData.discount > 24 && (
              <BadgePercent className="absolute right-0 z-20 mr-4" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            {skinData.discount < 0 && <p>Overpay</p>}
            {skinData.discount > 24 && <p>Desconto especial</p>}
          </TooltipContent>
        </Tooltip>
        <div className="flex flex-col items-center">
          <Image
            src={skinData.image}
            width={460}
            height={160}
            quality={100}
            alt={`Imagem da skin ${skinData.marketname}`}
            className="z-10 translate-y-[-10px] scale-105 transform pt-[25px] transition-transform duration-300 min-[425px]:group-hover:rotate-6 min-[425px]:group-hover:scale-[1.15]"
          />

          <div className="absolute left-[50px] top-[8.5rem] z-10">
            {skinData.charms?.map((charm, index) => (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <div className="w-12 overflow-hidden rounded-full">
                    <Image
                      src={charm.image}
                      alt={charm.name}
                      width={80}
                      height={80}
                      className="h-[70px] w-[70px] object-cover"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{charm.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="mt-2 h-[30px] w-full">
            {skinData.stickers?.length > 0 ? (
              <div className="flex justify-center">
                <div className="flex flex-wrap justify-center gap-2 rounded-md p-2">
                  {skinData.stickers.map((sticker, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger>
                        <div className="w-12 overflow-hidden rounded-full lg:w-[42px]">
                          <Image
                            src={sticker.image}
                            alt={sticker.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 lg:h-[42px] lg:w-[42px] object-cover rounded-full"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{sticker.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col px-3">
          {skinData.inspectlink && (
            <Tooltip>
              <TooltipTrigger>
                <a
                  href={skinData.inspectlink}
                  className="mb-2 flex items-center justify-center gap-2 text-center text-sm"
                >
                  <Eye size={20} />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Inspecionar no jogo</p>
              </TooltipContent>
            </Tooltip>
          )}
          <h2 className="z-20 mb-2 min-h-[40px] text-center text-sm font-bold">
            {skinData.marketname}
          </h2>
          {skinData.rarity && (
            <div className="flex items-center justify-center">
              <span
                className="text-xs font-semibold capitalize"
                style={{ color: `#${skinData.color}` }}
              >
                {skinData.rarity}
              </span>
            </div>
          )}
          <div className="flex h-[56px] items-center justify-between">
            <div>
              <h3
                className="cursor-pointer font-semibold text-red-500 line-through"
                onClick={() => {
                  window.open(
                    `https://steamcommunity.com/market/listings/730/${skinData.marketname}`,
                    '_blank',
                  )
                }}
              >
                R$ {priceInReais.toFixed(2)}
              </h3>
              <h4 className="font-semibold">R$ {discountPrice.toFixed(2)}</h4>
            </div>
            <div className="flex flex-col items-center">
              <span
                className={`mb-2 rounded-lg p-1 font-bold ${
                  skinData.discount < 0
                    ? 'bg-red-700 text-white'
                    : 'bg-green-700 text-white'
                }`}
              >
                {skinData.discount < 0 ? '+' : '-'}
                {Math.abs(skinData.discount)}%
              </span>
              <div className="flex items-center">
                {skinData.wear && (
                  <div className="rounded-md px-2 py-1 text-sm font-bold">
                    {skinData.wear.toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold">
                  {skinData.float_value?.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div
              className="w-full rounded-sm sm:min-h-[5px]"
              style={{
                height: '5px',
                backgroundImage:
                  'linear-gradient(to right, rgb(186, 255, 174), rgb(155, 255, 139), rgb(250, 255, 0), rgb(255, 165, 81), rgb(250, 95, 95))',
              }}
            ></div>
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="caret-up"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512"
              width="12"
              className="svg-inline--fa fa-caret-up fa-w-10 relative"
              style={{ left: `${(skinData.float_value || 0) * 100}%` }}
            >
              <path
                fill="currentColor"
                d="M288.662 352H31.338c-17.818 0-26.741-21.543-14.142-34.142l128.662-128.662c7.81-7.81 20.474-7.81 28.284 0l128.662 128.662c12.6 12.599 3.676 34.142-14.142 34.142z"
              ></path>
            </svg>
          </div>
          <motion.div
            initial={false}
            animate={{
              backgroundColor: inCart
                ? 'rgb(186, 44, 41)'
                : theme === 'light'
                  ? '#18181B'
                  : 'rgb(250, 250, 250)',
            }}
            className="mt-4 rounded-md"
          >
            <Button
              className="flex w-full items-center justify-center gap-2 bg-transparent hover:bg-transparent"
              onClick={handleCartAction}
            >
              {inCart ? (
                <>
                  Remover do carrinho <Trash2 size={18} />
                </>
              ) : (
                <>
                  Adicionar ao carrinho <ShoppingBag size={18} />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
