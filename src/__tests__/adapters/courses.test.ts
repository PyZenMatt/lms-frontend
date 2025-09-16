import { describe, it, expect } from 'vitest'
import { toCourseCardVM } from '@/adapters/courses'

describe('toCourseCardVM', () => {
  it('maps minimal payload to VM with defaults', () => {
    const dto = { id: 123, course_title: 'Intro to Art', price_eur: '9.99' }
    const vm = toCourseCardVM(dto as any)
    expect(vm.id).toBe('123')
    expect(vm.title).toBe('Intro to Art')
    expect(vm.price).toBeCloseTo(9.99)
  })

  it('handles edge payloads with nested price object', () => {
    const dto = { id: 'x', title: 'Edge', price: { amount: '15,50' }, instructor_name: 'Alice' }
    const vm = toCourseCardVM(dto as any)
    expect(vm.id).toBe('x')
    expect(vm.title).toBe('Edge')
    expect(vm.price).toBeCloseTo(15.5)
    expect(vm.instructor).toBe('Alice')
  })
})
