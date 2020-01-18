import { ExecutionContext } from '../ExecutionContext'
import { GasCost } from './gasCosts'
import { InvalidJumpDestination } from '../errors'
import { MachineWord } from '../MachineWord'

export function opSTOP (ctx: ExecutionContext) {
  ctx.useGas(GasCost.ZERO)
  ctx.running = false
}

export function opJUMPDEST (ctx: ExecutionContext) {
  ctx.useGas(GasCost.JUMPDEST)
}

export function opJUMP (ctx: ExecutionContext) {
  ctx.useGas(GasCost.MID)

  const destination = ctx.stack.pop()
  const location = destination.toUnsignedNumber()

  if (ctx.code[location] === opJUMPDEST) {
    ctx.programCounter = location
  } else {
    throw new InvalidJumpDestination(destination)
  }
}

export function opJUMPI (ctx: ExecutionContext) {
  ctx.useGas(GasCost.HIGH)

  const destination = ctx.stack.pop()
  const location = destination.toUnsignedNumber()
  const condition = ctx.stack.pop()

  if (!condition.equals(MachineWord.ZERO)) {
    if (ctx.code[location] === opJUMPDEST) {
      ctx.programCounter = location
    } else {
      throw new InvalidJumpDestination(destination)
    }
  }
}
