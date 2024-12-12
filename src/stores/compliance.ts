import { defineStore } from 'pinia'
import { type Ref, computed, reactive, ref } from 'vue'
import { getKeyByValue } from '@/helpers/objects'
import { callApi } from '@/helpers/request'

const loading = ref({
  state: false,
  message: 'Loading...',
})

const categoriesNames = [
  'Private Company',
  'Public Company',
  'Government Entity',
  'Cooperative Society',
  'Sole Proprietorship',
  'NGOs',
  'Individual/Informal Business',
] as const

export type CategoryName = (typeof categoriesNames)[number]

export type Categories = {
  [K in CategoryName]: {
    id: number
    description: string
    maxTier: TierValue
  };
}

export const categories: Categories = {
  'Private Company': {
    id: 1,
    description: `A private company is owned by a small group and not publicly traded.
    They have fewer regulatory requirements and more flexibility than public companies.
    Examples include small businesses, family-owned businesses, and privately held corporations.
    Private equity firms are also considered private companies.`,
    maxTier: 3,
  },
  'Public Company': {
    id: 2,
    description: `A public company is a business entity whose ownership is held by a large number of
    shareholders and whose shares are publicly traded on a stock exchange.
   The ownership of a public company can be bought and sold by anyone who wishes to invest,
   subject to certain regulatory requirements.`,
    maxTier: 3,
  },
  'Government Entity': {
    id: 3,
    description: `A government entity is an organization that is established and funded by a government to provide services or
   perform specific functions on behalf of the government or the public.`,
    maxTier: 1,
  },
  'Cooperative Society': {
    id: 4,
    description: `A cooperative society is a business organization that is owned and controlled by its members
    who share a common interest, such as a community, profession, or industry. Members of a cooperative
    society pool their resources and work together to achieve common goals,
   such as producing goods or providing services.`,
    maxTier: 1,
  },
  'Sole Proprietorship': {
    id: 5,
    description: `A sole proprietorship is a business entity that is owned and operated by a single individual.
    The owner of a sole proprietorship is personally liable for the debts and obligations of the business, 
    and they have full control over its operations.`,
    maxTier: 2,
  },
  'NGOs': {
    id: 6,
    description: `A non-governmental organization, or NGO, is a non-profit organization that is independent
    from government and operates for the public benefit. NGOs typically work on a variety of social, environmental,
     and humanitarian issues, and they may receive funding from private donations, grants, or other sources.`,
    maxTier: 2,
  },
  'Individual/Informal Business': {
    id: 7,
    description: `An individual or informal business is a type of business that is typically run by one 
    person or a small group of individuals without the formal legal structure of a corporation or limited 
    liability company (LLC).`,
    maxTier: 2,
  },
}

export interface CategoriesValues {
  id: number
  description: string
}

export const Tiers = {
  Zero: 0,
  One: 1,
  Two: 2,
  Three: 3,
} as const

export type TierValue = (typeof Tiers)[keyof typeof Tiers]

export type TierKey = keyof typeof Tiers

export interface Limits {
  transactionLimit: string | null
  holdingLimit: string
}

const categoriesTiersLimits: {
  [K in CategoryName]: {
    Zero: Limits
    One: Limits
    Two?: Limits
    Three?: Limits
  };
} = {
  'Cooperative Society': {
    Zero: {
      holdingLimit: '1,000,000',
      transactionLimit: null,
    },
    One: {
      holdingLimit: 'Unlimited',
      transactionLimit: 'Unlimited',
    },
  },
  'Government Entity': {
    Zero: {
      holdingLimit: '1,000,000',
      transactionLimit: null,
    },
    One: {
      holdingLimit: '20,000',
      transactionLimit: '10,000,000',
    },
  },
  'Individual/Informal Business': {
    Zero: {
      holdingLimit: '250,000',
      transactionLimit: null,
    },
    One: {
      holdingLimit: '1,000,000',
      transactionLimit: '10,000',
    },
    Two: {
      holdingLimit: 'Unlimited',
      transactionLimit: 'Unlimited',
    },
  },
  'NGOs': {
    Zero: {
      holdingLimit: '500,000',
      transactionLimit: null,
    },
    One: {
      holdingLimit: '1,000,000',
      transactionLimit: '50,000',
    },
    Two: {
      holdingLimit: 'Unlimited',
      transactionLimit: 'Unlimited',
    },
  },
  'Private Company': {
    Zero: {
      holdingLimit: '500,000',
      transactionLimit: null,
    },
    One: {
      holdingLimit: '2,000,000',
      transactionLimit: '10,000',
    },
    Two: {
      holdingLimit: '5,000,000',
      transactionLimit: '50,000',
    },
    Three: {
      holdingLimit: 'Unlimited',
      transactionLimit: 'Unlimited',
    },
  },
  'Public Company': {
    Zero: {
      holdingLimit: '500,000',
      transactionLimit: null,
    },
    One: {
      holdingLimit: '1,000,000',
      transactionLimit: '20,000',
    },
    Two: {
      holdingLimit: '5,000,000',
      transactionLimit: '50,000',
    },
    Three: {
      holdingLimit: 'Unlimited',
      transactionLimit: 'Unlimited',
    },
  },
  'Sole Proprietorship': {
    Zero: {
      holdingLimit: '100,000',
      transactionLimit: null,
    },
    One: {
      holdingLimit: '1,000,000',
      transactionLimit: '10,000',
    },
    Two: {
      holdingLimit: 'Unlimited',
      transactionLimit: 'Unlimited',
    },
  },
}

export const useComplianceStore = defineStore('compliance', () => {
  const currentTier: Ref<TierValue | null> = ref(null)
  const previewTier: Ref<TierValue> = ref(0)

  const message = ref({
    showMsg: false,
    showMiniMsg: false,
  })

  const showModal = ref(false)

  const toggleModal = () => {
    showModal.value = !showModal.value
  }

  const selectedCategoryName: Ref<CategoryName | null> = ref(null)

  const buildTierMessage = (
    tier: TierValue,
    holdingLimit: string,
    transactionLimit?: string,
  ) => {
    if (tier === 0)
      return `Complete Tier 0 to increase your account holding limit to ${holdingLimit}.`

    return `Complete Tier ${tier} to increase your daily transaction limit to ${transactionLimit} 
    and your account holding limit to ${holdingLimit}.`
  }

  const getCategoryName = (category: { id: number; description: string }) => {
    return Object.keys(categories).find(
      key => categories[key as CategoryName] === category,
    ) as CategoryName
  }

  const findCategoryKeyById = (id: number) => {
    const [key, category]
      = Object.entries(categories).find(
        ([key, { id: categoryId }]) => categoryId === id,
      ) || []

    return key || null
  }

  const messageContent = computed(() => {
    const categoryTiersLimits
      = categoriesTiersLimits[selectedCategoryName.value as CategoryName]

    const tier = currentTier.value ?? 0

    const tierLimits = categoryTiersLimits[
      getKeyByValue(Tiers, tier) as TierKey
    ] as Limits

    const { transactionLimit, holdingLimit } = tierLimits

    return buildTierMessage(
      tier as TierValue,
      holdingLimit,
      transactionLimit as string,
    )
  })

  const previousTier = computed(() => {
    if (!currentTier.value)
      return currentTier.value

    const minTier = Math.min(...Object.values(Tiers))

    return currentTier.value === minTier
      ? currentTier.value
      : currentTier.value - 1
  })

  const nextTier = computed(() => {
    if (!currentTier.value)
      return 1

    return currentTier.value === maxTier.value
      ? currentTier.value
      : currentTier.value + 1
  })

  const maxTier = computed(() => {
    const category = categories[selectedCategoryName.value as CategoryName]

    return category?.maxTier ?? 0
  })

  const next = () => {
    if (!currentTier.value) {
      currentTier.value = 1
    }
    else {
      if (currentTier.value === maxTier.value)
        return

      currentTier.value++
    }
    toggleModal()
  }

  const cardTitle = computed(() => {
    return currentTier.value === null
      ? 'Organization/Business Information'
      : (selectedCategoryName.value as CategoryName)
  })

  const selectCategory = (clickedCategory: CategoryName | null) => {
    selectedCategoryName.value = clickedCategory

    message.value.showMsg = true
    message.value.showMiniMsg = false
  }

  const successModalData = computed(() => {
    const limits
      = categoriesTiersLimits[selectedCategoryName.value as CategoryName]

    const nTier = nextTier.value ?? 1

    const nextTierLimits = limits[getKeyByValue(Tiers, nTier) as TierKey]

    const { holdingLimit, transactionLimit } = nextTierLimits as Limits

    const cTier = currentTier.value ?? 0

    const current = limits[getKeyByValue(Tiers, cTier) as TierKey] as Limits

    const { holdingLimit: holdingLimit2, transactionLimit: transactionLimit2 }
      = current

    return {
      next: { holdingLimit, transactionLimit, tier: nTier },
      current: {
        holdingLimit: holdingLimit2,
        transactionLimit: transactionLimit2,
        tier: cTier,
      },
    }
  })

  const complianceTierZero: Ref<any> = ref({})
  const complianceTierOne: Ref<any> = ref({})
  const complianceTierTwo: Ref<any> = ref({})
  const complianceTierThree: Ref<any> = ref({})

  const fetchCompliance = async () => {
    loading.value.state = true
    loading.value.message = 'Loading compliance...'

    const response = await callApi({
      url: 'compliance/merchant/profile',
      method: 'GET',
      authorized: true,
    })

    const responseData = await response.json()

    const {
      data: {
        current_tier,
        organization_type,
        compliance_tier_zero,
        compliance_tier_one,
        compliance_tier_two,
        compliance_tier_three,
      },
    } = responseData

    currentTier.value = current_tier !== null ? current_tier + 1 : null
    complianceTierZero.value = compliance_tier_zero
    complianceTierOne.value = compliance_tier_one
    complianceTierTwo.value = compliance_tier_two
    complianceTierThree.value = compliance_tier_three

    selectedCategoryName.value
      = organization_type === 0
        ? null
        : (findCategoryKeyById(organization_type) as CategoryName)

    loading.value.state = false
  }

  const complianceParams = reactive({
    organization_categories: [],
    identification_types: [],
    staff_sizes: [],
    industries: [],
    countries: [],
  }) as {
    organization_categories: {
      id: number
      name: string
      desc: string
    }[]
    identification_types: {
      id: number
      name: string
    }[]
    staff_sizes: {
      id: number
      name: string
    }[]
    industries: {
      id: number
      name: string
      industry_categories: {
        id: number
        industry_id: number
        name: number
      }[]
    }[]
    countries: {
      id: number
      country_name: string
    }[]
  }

  const fetchComplianceParams = async () => {
    loading.value.state = true
    loading.value.message = 'Loading form fields...'

    const response = await callApi({
      url: 'compliance/compliance-params',
      method: 'GET',
      authorized: true,
    })

    const responseData = await response.json()

    const {
      data: {
        organization_categories,
        identification_types,
        staff_sizes,
        industries,
        countries,
      },
    } = responseData

    complianceParams.organization_categories = organization_categories
    complianceParams.identification_types = identification_types
    complianceParams.staff_sizes = staff_sizes
    complianceParams.industries = industries
    complianceParams.countries = countries
    loading.value.state = false
  }

  const completed = computed(() => {
    return (currentTier.value as TierValue) > maxTier.value
  })

  const changePreviewTier = (tier: TierValue) => {
    previewTier.value = tier
  }

  return {
    toggleModal,
    selectCategory,
    categories,
    message,
    currentTier,
    showModal,
    selectedCategoryName,
    getCategoryName,
    previousTier,
    nextTier,
    next,
    messageContent,
    cardTitle,
    successModalData,
    fetchCompliance,
    maxTier,
    loading,
    fetchComplianceParams,
    complianceParams,
    completed,
    changePreviewTier,
    previewTier,
    complianceTierZero,
    complianceTierOne,
    complianceTierTwo,
    complianceTierThree,
  }
})
